import { Request, Response, NextFunction } from 'express';
import { storage, db } from '../config/firebase';
import { FieldValue } from 'firebase-admin/firestore';
import { writeAuditLog } from '../audit/auditLogger';
import { v4 as uuidv4 } from 'uuid';

const ALLOWED_MIME_TYPES: Record<string, string[]> = {
  image: ['image/jpeg', 'image/png', 'image/webp'],
  audio: ['audio/m4a', 'audio/wav', 'audio/mp3', 'audio/x-m4a', 'audio/mpeg']
};

export const initUpload = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { visitId } = req.params;
    const { patientId, fileType, mimeType, size } = req.body;
    const user = (req as any).user;

    // Validation
    if (!patientId || !fileType || !mimeType) {
      return res.status(400).json({ error: 'patientId, fileType, and mimeType are required' });
    }

    if (fileType !== 'image' && fileType !== 'audio') {
      return res.status(400).json({ error: 'fileType must be image or audio' });
    }

    if (!ALLOWED_MIME_TYPES[fileType].includes(mimeType)) {
      return res.status(400).json({ error: `Unsupported MIME type for ${fileType}` });
    }

    // Check visit exists and belongs to patient
    const visitDoc = await db.collection('patients').doc(patientId).collection('visits').doc(visitId).get();
    if (!visitDoc.exists) {
      return res.status(404).json({ error: 'Visit not found' });
    }

    const fileId = uuidv4();
    // Using recommended folder structure
    const storagePath = `patients/${patientId}/visits/${visitId}/${fileType === 'image' ? 'images' : 'audio'}/${fileId}`;

    // Get a signed URL for uploading
    const bucket = storage.bucket();
    const file = bucket.file(storagePath);
    
    const [signedUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
      contentType: mimeType,
    });

    return res.status(200).json({
      uploadUrl: signedUrl,
      fileId,
      storagePath
    });
  } catch (error) {
    next(error);
  }
};

export const completeUpload = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { visitId } = req.params;
    const { fileId, patientId, fileType, mimeType, storagePath, size } = req.body;
    const user = (req as any).user;

    // Verify file actually exists in storage
    const bucket = storage.bucket();
    const file = bucket.file(storagePath);
    const [exists] = await file.exists();

    if (!exists) {
      return res.status(404).json({ error: 'File not found in storage. Upload may have failed.' });
    }

    const metadata = {
      fileId,
      patientId,
      visitId,
      uploadedBy: user.uid,
      fileType,
      mimeType,
      storagePath,
      size: size || null,
      createdAt: FieldValue.serverTimestamp(),
    };

    // Save metadata in Firestore subcollection (recommended approach for unbounded attachments)
    await db.collection('visits').doc(visitId).collection('uploads').doc(fileId).set(metadata);
    await db.collection('patients').doc(patientId).collection('visits').doc(visitId).collection('uploads').doc(fileId).set(metadata);

    await writeAuditLog({
      actorUid: user.uid,
      actorRole: user.role || 'health_worker',
      action: 'FILE_UPLOADED',
      patientId,
      visitId,
      metadata: { fileId, fileType }
    });

    return res.status(200).json({ message: 'Upload completed and verified', metadata });
  } catch (error) {
    next(error);
  }
};

export const deleteUpload = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { visitId, fileId } = req.params;
    const { patientId, storagePath } = req.body;
    const user = (req as any).user;

    if (!patientId || !storagePath) {
      return res.status(400).json({ error: 'patientId and storagePath are required in body' });
    }

    // Delete from Storage
    const bucket = storage.bucket();
    const file = bucket.file(storagePath);
    try {
      await file.delete();
    } catch (err: any) {
      // If it's already deleted in storage, we can proceed to clean up firestore
      if (err.code !== 404) {
        throw err;
      }
    }

    // Delete from Firestore
    await db.collection('visits').doc(visitId).collection('uploads').doc(fileId).delete();
    await db.collection('patients').doc(patientId).collection('visits').doc(visitId).collection('uploads').doc(fileId).delete();

    await writeAuditLog({
      actorUid: user.uid,
      actorRole: user.role || 'health_worker',
      action: 'FILE_DELETED',
      patientId,
      visitId,
      metadata: { fileId, storagePath }
    });

    return res.status(200).json({ message: 'File deleted successfully' });
  } catch (error) {
    next(error);
  }
};
