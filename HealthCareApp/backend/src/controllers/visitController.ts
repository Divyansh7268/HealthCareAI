import { Request, Response, NextFunction } from 'express';
import { db } from '../config/firebase';
import { FieldValue } from 'firebase-admin/firestore';
import { writeAuditLog } from '../audit/auditLogger';

const PATIENTS_COLLECTION = 'patients';
const VISITS_COLLECTION = 'visits';

export const createVisit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { patientId } = req.params;
    const user = (req as any).user;
    const workerUid = user.uid;
    const visitData = req.body;

    const newVisitRef = db.collection(VISITS_COLLECTION).doc();
    const visitId = newVisitRef.id;

    const data = {
      patientId,
      healthWorkerId: workerUid,
      clinicId: visitData.clinicId || null,
      symptoms: visitData.symptoms || [],
      chiefComplaint: visitData.chiefComplaint || null,
      voiceTranscript: visitData.voiceTranscript || null,
      bodyLocations: visitData.bodyLocations || [],
      medicalImageRefs: visitData.medicalImageRefs || [],
      vitals: visitData.vitals || {},
      status: 'draft',
      riskLevel: null,
      doctorReviewStatus: 'not_required',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      version: 1,
    };

    const batch = db.batch();
    batch.set(newVisitRef, data);
    
    const subColRef = db.collection(PATIENTS_COLLECTION).doc(patientId).collection(VISITS_COLLECTION).doc(visitId);
    batch.set(subColRef, { visitId, ...data });

    await batch.commit();

    await writeAuditLog({
      actorUid: workerUid,
      actorRole: user.role || 'health_worker',
      action: 'VISIT_CREATED',
      patientId: patientId,
      visitId: visitId
    });

    return res.status(201).json({
      message: 'Visit created successfully',
      visit: { id: visitId, ...data }
    });
  } catch (error) {
    next(error);
  }
};

export const getVisitById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { visitId } = req.params;
    const docRef = await db.collection(VISITS_COLLECTION).doc(visitId).get();

    if (!docRef.exists) {
      return res.status(404).json({ error: 'Visit not found' });
    }

    return res.status(200).json({
      visit: { id: docRef.id, ...docRef.data() }
    });
  } catch (error) {
    next(error);
  }
};

export const updateVisit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { patientId, visitId } = req.params;
    const updates = req.body;
    const user = (req as any).user;

    delete updates.createdAt;
    delete updates.healthWorkerId;
    delete updates.patientId;

    updates.updatedAt = FieldValue.serverTimestamp();

    const batch = db.batch();
    const topRef = db.collection(VISITS_COLLECTION).doc(visitId);
    batch.update(topRef, updates);

    const subRef = db.collection(PATIENTS_COLLECTION).doc(patientId).collection(VISITS_COLLECTION).doc(visitId);
    batch.update(subRef, updates);

    await batch.commit();

    await writeAuditLog({
      actorUid: user.uid,
      actorRole: user.role || 'health_worker',
      action: 'VISIT_UPDATED',
      patientId: patientId,
      visitId: visitId
    });

    return res.status(200).json({ message: 'Visit updated successfully' });
  } catch (error) {
    next(error);
  }
};
import { analyzeVisitSchema } from '../validators/visitValidator';
import { runDeterministicRules } from '../rules/ruleEngine';
import { processClinicalAI } from '../ai/aiService';
import { getVisit, saveAIAssessment } from '../services/visitService';
import { buildClinicalContext } from '../services/clinicalContextService';
import { createAuditLog } from '../services/auditService';
import { computePatientTrend, TrendResult } from '../services/trendService';

/**
 * POST /api/v1/visits/:visitId/analyze
 */
export async function analyzeVisit(req: Request, res: Response) {
  const { visitId } = req.params;
  const user = (req as any).user;

  console.log(`[analyzeVisit] Request from user ${user?.uid} for visit ${visitId}`);

  // ── Step 1: Validate Request Body ────────────────────────────
  const parseResult = analyzeVisitSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      error: 'Invalid request body',
      details: parseResult.error.flatten().fieldErrors,
    });
  }

  const visitData = parseResult.data;
  const { patientId } = visitData;

  // ── Step 2: Fetch Visit & Verify Ownership ───────────────────
  let visit: any;
  try {
    visit = await getVisit(patientId, visitId);
  } catch (err: any) {
    return res.status(404).json({ error: err.message });
  }

  // ── Step 3: Retrieve Patient Visit History ───────────────────
  let patientHistory = '{}';
  try {
    const contextObj = await buildClinicalContext(patientId, visitId);
    patientHistory = JSON.stringify(contextObj, null, 2);
  } catch (err) {
    console.warn('[analyzeVisit] Could not fetch patient history:', err);
  }

  // ── Step 3b: Compute Longitudinal Trend ──────────────────────
  let trendResult: TrendResult | null = null;
  try {
    trendResult = await computePatientTrend({
      patientId,
      visitId,
      vitals: visitData.vitals,
      symptoms: visitData.symptoms,
      bodyLocations: visitData.bodyLocations,
    });
    console.log(`[analyzeVisit] Trend computed: ${trendResult.overallTrend} (compared ${trendResult.comparedVisitCount} visits)`);
    // Append factual trend summary to history context — the AI may interpret but must not invent
    patientHistory = JSON.stringify(
      { ...JSON.parse(patientHistory || '{}'), longitudinalTrend: trendResult },
      null, 2
    );
  } catch (err) {
    console.warn('[analyzeVisit] Trend computation failed — proceeding without trend:', err);
  }

  // ── Step 4: Load relevant image/audio references ────────────────
  let imageParts: any[] = [];
  try {
    const { db, storage } = require('../config/firebase');
    const uploadsSnap = await db.collection('patients').doc(patientId)
      .collection('visits').doc(visitId).collection('uploads').get();
    
    if (!uploadsSnap.empty) {
      const mediaRefs: string[] = [];
      const bucket = storage.bucket();

      for (const doc of uploadsSnap.docs) {
        const data = doc.data();
        mediaRefs.push(`[Uploaded File] Type: ${data.mimeType}, Name: ${data.fileName || doc.id}`);
        
        // If it's an image, download it and add it to imageParts for Gemini
        if (data.fileType === 'image' && data.storagePath) {
          try {
            const file = bucket.file(data.storagePath);
            const [exists] = await file.exists();
            if (exists) {
              const [buffer] = await file.download();
              imageParts.push({
                inlineData: {
                  data: buffer.toString('base64'),
                  mimeType: data.mimeType
                }
              });
            }
          } catch (dlErr) {
            console.warn(`[analyzeVisit] Could not download image ${data.storagePath}:`, dlErr);
          }
        }
      }
      // Append these to the imageDescriptions field so the AI knows files were uploaded
      visitData.imageDescriptions = [...(visitData.imageDescriptions || []), ...mediaRefs];
      console.log(`[analyzeVisit] Loaded ${mediaRefs.length} media references, ${imageParts.length} actual image buffers.`);
    }
  } catch (err) {
    console.warn('[analyzeVisit] Could not fetch media references:', err);
  }

  // ── Step 5: Run Rule Engine ──────────────────────────────────
  const ruleResult = runDeterministicRules(visitData);
  console.log(`[analyzeVisit] Rule engine complete. Critical: ${ruleResult.critical}, Flags: ${ruleResult.ruleTriggered.length}`);

  // ── Step 6 & 7: Gemini AI Call + Validation ──────────────────
  let aiAssessment;
  try {
    const aiResult = await processClinicalAI(visitData, ruleResult, patientHistory, imageParts);
    aiAssessment = aiResult.assessment;
  } catch (err: any) {
    console.error('[analyzeVisit] Gemini failed:', err.message);
    return res.status(502).json({
      error: 'AI service temporarily unavailable',
      details: err.message,
      ruleEngineResult: ruleResult,
    });
  }

  // ── Step 7: Save to Firestore & Audit Log ────────────────────
  let assessmentId: string;
  try {
    assessmentId = await saveAIAssessment(
      patientId,
      visitId,
      aiAssessment,
      ruleResult,
      user?.uid || 'system',
      trendResult ?? undefined
    );
    
    // Explicitly create an audit log
    await createAuditLog('AI_ASSESSMENT_GENERATED', user?.uid || 'system', visitId, {
      patientId,
      assessmentId,
      riskLevel: aiAssessment.riskLevel
    });
  } catch (err: any) {
    console.error('[analyzeVisit] Failed to save assessment:', err.message);
    return res.status(500).json({ error: 'Failed to save AI assessment to database', details: err.message });
  }

  // ── Step 8: Return Response ──────────────────────────────────
  return res.status(200).json({
    success: true,
    assessmentId,
    assessment: aiAssessment,
    longitudinalTrend: trendResult,
    ruleEngineFlags: ruleResult.ruleTriggered,
    visitId,
    patientId,
  });
}

export const sendToDoctor = async (req: Request, res: Response) => {
  try {
    const { visitId } = req.params;
    const { patientId } = req.body;
    if (!visitId || !patientId) {
      return res.status(400).json({ error: 'visitId and patientId are required' });
    }
    const { db } = require('../config/firebase');
    const COLLECTIONS = { PATIENTS: 'patients', VISITS: 'visits' };
    const visitRef = db.collection(COLLECTIONS.PATIENTS).doc(patientId).collection(COLLECTIONS.VISITS).doc(visitId);
    await visitRef.update({ doctorReviewStatus: 'review_required', updatedAt: new Date() });
    await db.collection(COLLECTIONS.VISITS).doc(visitId).set({ doctorReviewStatus: 'review_required', updatedAt: new Date() }, { merge: true });
    return res.status(200).json({ success: true, message: 'Sent to doctor' });
  } catch (error: any) {
    console.error('[sendToDoctor] Failed:', error.message);
    return res.status(500).json({ error: 'Failed to send to doctor' });
  }
};

export const getPendingReviews = async (req: Request, res: Response) => {
  try {
    const { db } = require('../config/firebase');
    const COLLECTIONS = { VISITS: 'visits', PATIENTS: 'patients', AI_ASSESSMENTS: 'aiAssessments' };
    const snapshot = await db.collection(COLLECTIONS.VISITS)
      .where('doctorReviewStatus', '==', 'review_required')
      .get();
    
    let visits: any[] = [];
    
    for (const doc of snapshot.docs) {
      const visitData = doc.data();
      const patientId = visitData.patientId;
      let patientInfo = {};
      
      if (patientId) {
        const patientDoc = await db.collection(COLLECTIONS.PATIENTS).doc(patientId).get();
        if (patientDoc.exists) {
          const pData = patientDoc.data();
          patientInfo = {
            patientName: pData.name || pData.fullName || 'Unknown Patient',
            patientAge: pData.age || pData.dateOfBirth || '--',
            patientGender: pData.gender || '--'
          };
        }
      }

      let aiAssessment = visitData.aiAssessment || {};
      if (visitData.aiAssessmentId && Object.keys(aiAssessment).length === 0) {
        const aiDoc = await db.collection(COLLECTIONS.AI_ASSESSMENTS).doc(visitData.aiAssessmentId).get();
        if (aiDoc.exists) {
          aiAssessment = aiDoc.data();
        }
      }
      
      visits.push({ id: doc.id, ...visitData, ...patientInfo, aiAssessment });
    }

    // Sort newest first (descending)
    visits.sort((a, b) => {
      const timeA = a.updatedAt?._seconds || a.createdAt?._seconds || 0;
      const timeB = b.updatedAt?._seconds || b.createdAt?._seconds || 0;
      return timeB - timeA;
    });

    return res.status(200).json({ success: true, visits });
  } catch (error: any) {
    console.error('[getPendingReviews] Failed:', error.message);
    return res.status(500).json({ error: 'Failed to fetch pending reviews' });
  }
};

export const submitDoctorReview = async (req: Request, res: Response) => {
  try {
    const { visitId } = req.params;
    const { patientId, action, reviewNotes, updatedConditions, updatedRecommendations } = req.body;
    if (!visitId || !patientId) return res.status(400).json({ error: 'visitId and patientId required' });
    
    const { db } = require('../config/firebase');
    const COLLECTIONS = { PATIENTS: 'patients', VISITS: 'visits', AI_ASSESSMENTS: 'aiAssessments' };
    
    const visitRef = db.collection(COLLECTIONS.PATIENTS).doc(patientId).collection(COLLECTIONS.VISITS).doc(visitId);
    
    const updateData = {
      doctorReviewStatus: action, // 'approved', 'corrected', 'rejected'
      doctorNotes: reviewNotes || '',
      updatedAt: new Date()
    };
    
    await visitRef.update(updateData);
    await db.collection(COLLECTIONS.VISITS).doc(visitId).set(updateData, { merge: true });
    
    // Also update the AI assessment if there are corrections
    const visitDoc = await visitRef.get();
    const visitData = visitDoc.data();
    if (visitData && visitData.aiAssessmentId && (updatedConditions || updatedRecommendations)) {
      await db.collection(COLLECTIONS.AI_ASSESSMENTS).doc(visitData.aiAssessmentId).set({
        doctorCorrected: true,
        correctedConditions: updatedConditions || [],
        correctedRecommendations: updatedRecommendations || [],
        correctedAt: new Date()
      }, { merge: true });
    }
    
    return res.status(200).json({ success: true, message: 'Review submitted successfully' });
  } catch (error: any) {
    console.error('[submitDoctorReview] Failed:', error.message);
    return res.status(500).json({ error: 'Failed to submit review' });
  }
};
