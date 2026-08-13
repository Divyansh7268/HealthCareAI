import { Request, Response, NextFunction } from 'express';
import { db, storage } from '../config/firebase';
import { FieldValue } from 'firebase-admin/firestore';
import { writeAuditLog } from '../audit/auditLogger';
import { transcribeAudio } from '../ai/transcriptionService';
import { v4 as uuidv4 } from 'uuid';

export const transcribeVisitAudio = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { visitId } = req.params;
    const { fileId, storagePath } = req.body;
    const user = (req as any).user;

    if (!fileId || !storagePath) {
      return res.status(400).json({ error: 'fileId and storagePath are required' });
    }

    // 1. Validate Visit and File metadata
    const visitDocRef = db.collection('visits').doc(visitId);
    const visitDoc = await visitDocRef.get();

    if (!visitDoc.exists) {
      return res.status(404).json({ error: 'Visit not found' });
    }

    const patientId = visitDoc.data()?.patientId;

    const fileDocRef = visitDocRef.collection('uploads').doc(fileId);
    const fileDoc = await fileDocRef.get();

    if (!fileDoc.exists) {
      return res.status(404).json({ error: 'File metadata not found in visit uploads' });
    }

    const fileData = fileDoc.data()!;
    if (fileData.fileType !== 'audio') {
      return res.status(400).json({ error: 'Provided fileId is not an audio file' });
    }

    if (fileData.storagePath !== storagePath) {
      return res.status(400).json({ error: 'storagePath mismatch' });
    }

    // 2. Download audio buffer from Firebase Storage
    const bucket = storage.bucket();
    const file = bucket.file(storagePath);
    const [exists] = await file.exists();

    if (!exists) {
      return res.status(404).json({ error: 'Audio file not found in storage bucket' });
    }

    const [audioBuffer] = await file.download();

    // 3. Process with Gemini
    const transcriptionResult = await transcribeAudio(audioBuffer, fileData.mimeType);

    // 4. Save transcript record
    const transcriptId = uuidv4();
    const transcriptRecord = {
      id: transcriptId,
      text: transcriptionResult.text,
      language: transcriptionResult.language,
      extractedSymptoms: transcriptionResult.extractedSymptoms,
      confidenceIfAvailable: null, // Gemini JSON doesn't provide confidence by default
      modelProvider: 'Google',
      modelName: 'gemini-1.5-flash',
      audioFileId: fileId,
      createdAt: FieldValue.serverTimestamp(),
    };

    const batch = db.batch();
    
    // Save to transcripts subcollection under visit
    const transcriptRef = visitDocRef.collection('transcripts').doc(transcriptId);
    batch.set(transcriptRef, transcriptRecord);

    // Update the visit's symptoms array by merging the extracted ones securely
    // We shouldn't overwrite existing symptoms, so we'll use arrayUnion if we have symptoms
    if (transcriptionResult.extractedSymptoms.length > 0) {
      batch.update(visitDocRef, {
        symptoms: FieldValue.arrayUnion(...transcriptionResult.extractedSymptoms)
      });
      // also update patient sub-collection visit mirror
      const mirrorVisitRef = db.collection('patients').doc(patientId).collection('visits').doc(visitId);
      batch.update(mirrorVisitRef, {
        symptoms: FieldValue.arrayUnion(...transcriptionResult.extractedSymptoms)
      });
    }

    await batch.commit();

    // 5. Audit Log
    await writeAuditLog({
      actorUid: user.uid,
      actorRole: user.role || 'health_worker',
      action: 'VOICE_TRANSCRIBED',
      patientId,
      visitId,
      metadata: { fileId, transcriptId }
    });

    return res.status(200).json({
      message: 'Transcription completed successfully',
      transcript: {
        ...transcriptRecord,
        createdAt: new Date().toISOString() // for immediate frontend use
      }
    });

  } catch (error) {
    next(error);
  }
};
