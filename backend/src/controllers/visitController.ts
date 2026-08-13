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
import { runRuleEngine } from '../ai/ruleEngine';
import { analyzeWithGemini } from '../ai/geminiService';
import { getVisit, getPatientVisitHistory, saveAIAssessment } from '../services/visitService';

/**
 * POST /api/visits/:visitId/analyze
 * 
 * Full AI pipeline:
 *   1. Validate request body
 *   2. Fetch visit from Firestore (ownership check)
 *   3. Retrieve patient visit history
 *   4. Run clinical rule engine
 *   5. Call Gemini with structured prompt
 *   6. Validate Gemini response with Zod
 *   7. Save to Firestore aiAssessments
 *   8. Return assessment to frontend
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
  let patientHistory = '';
  try {
    patientHistory = await getPatientVisitHistory(patientId, 3);
  } catch (err) {
    // Non-fatal — Gemini will proceed without history
    console.warn('[analyzeVisit] Could not fetch patient history:', err);
  }

  // ── Step 4: Run Rule Engine ──────────────────────────────────
  const ruleResult = runRuleEngine(visitData);
  console.log(`[analyzeVisit] Rule engine complete. Risk hint: ${ruleResult.overallRiskHint}, Flags: ${ruleResult.flags.length}`);

  // ── Step 5 & 6: Gemini AI Call + Validation ──────────────────
  let aiAssessment;
  try {
    aiAssessment = await analyzeWithGemini(visitData, ruleResult, patientHistory);
  } catch (err: any) {
    console.error('[analyzeVisit] Gemini failed:', err.message);
    return res.status(502).json({
      error: 'AI service temporarily unavailable',
      details: err.message,
      // Include rule engine result so frontend isn't left with nothing
      ruleEngineResult: ruleResult,
    });
  }

  // ── Step 7: Save to Firestore ────────────────────────────────
  let assessmentId: string;
  try {
    assessmentId = await saveAIAssessment(
      patientId,
      visitId,
      aiAssessment,
      ruleResult,
      user?.uid || 'system'
    );
  } catch (err: any) {
    console.error('[analyzeVisit] Failed to save assessment:', err.message);
    return res.status(500).json({ error: 'Failed to save AI assessment to database', details: err.message });
  }

  // ── Step 8: Return Response ──────────────────────────────────
  return res.status(200).json({
    success: true,
    assessmentId,
    assessment: aiAssessment,
    ruleEngineFlags: ruleResult.flags,
    visitId,
    patientId,
  });
}
