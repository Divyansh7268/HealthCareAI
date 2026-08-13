/**
 * Visit Service
 * 
 * Backend service layer for patient/visit operations.
 * Uses Firebase Admin SDK (full Firestore access, bypasses security rules).
 */

import { db } from '../config/firebase';
import { FieldValue } from 'firebase-admin/firestore';
import { AIAssessmentResult } from '../validators/visitValidator';
import { RuleEngineResult } from '../ai/ruleEngine';

const COLLECTIONS = {
  PATIENTS: 'patients',
  VISITS: 'visits',
  AI_ASSESSMENTS: 'aiAssessments',
};

/**
 * Fetch a visit document and validate it belongs to the given patient.
 */
export async function getVisit(patientId: string, visitId: string) {
  const visitRef = db
    .collection(COLLECTIONS.PATIENTS)
    .doc(patientId)
    .collection(COLLECTIONS.VISITS)
    .doc(visitId);

  const snap = await visitRef.get();
  if (!snap.exists) {
    throw new Error(`Visit ${visitId} not found under patient ${patientId}`);
  }
  return { id: snap.id, ...snap.data() };
}

/**
 * Fetch the last N visits of a patient (for history context sent to Gemini).
 */
export async function getPatientVisitHistory(patientId: string, limit = 3): Promise<string> {
  const snap = await db
    .collection(COLLECTIONS.PATIENTS)
    .doc(patientId)
    .collection(COLLECTIONS.VISITS)
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();

  if (snap.empty) return 'No previous visits.';

  return snap.docs
    .map((doc, idx) => {
      const d = doc.data();
      return `Visit ${idx + 1} (${d.createdAt?.toDate?.()?.toLocaleDateString?.() || 'unknown date'}): Symptoms=${d.symptoms || 'N/A'}, Risk=${d.riskLevel || 'N/A'}`;
    })
    .join('\n');
}

/**
 * Save the full AI assessment to Firestore.
 * Writes to:
 *   - /aiAssessments/{assessmentId}  (global collection, for doctor portal queries)
 *   - /patients/{patientId}/visits/{visitId}  (updates visit with risk level + status)
 */
export async function saveAIAssessment(
  patientId: string,
  visitId: string,
  assessment: AIAssessmentResult,
  ruleResult: RuleEngineResult,
  assessedByUserId: string
): Promise<string> {
  const now = FieldValue.serverTimestamp();

  const assessmentData = {
    patientId,
    visitId,
    assessedByUserId,
    assessedAt: now,
    // AI output
    riskLevel: assessment.riskLevel,
    possibleConditions: assessment.possibleConditions,
    recommendedActions: assessment.recommendedActions,
    urgency: assessment.urgency,
    treatmentSuggestions: assessment.treatmentSuggestions,
    referralRequired: assessment.referralRequired,
    referralReason: assessment.referralReason || null,
    followUpAdvice: assessment.followUpAdvice || null,
    confidenceScore: assessment.confidenceScore || null,
    disclaimer: assessment.disclaimer || null,
    // Rule engine flags for traceability
    ruleEngineFlags: ruleResult.flags,
    ruleEngineRiskHint: ruleResult.overallRiskHint,
    // Audit
    aiModel: 'gemini-1.5-flash',
    status: 'pending_review',
  };

  // Write to global aiAssessments collection
  const assessmentRef = await db.collection(COLLECTIONS.AI_ASSESSMENTS).add(assessmentData);

  // Update the visit record with key summary fields
  const visitRef = db
    .collection(COLLECTIONS.PATIENTS)
    .doc(patientId)
    .collection(COLLECTIONS.VISITS)
    .doc(visitId);

  await visitRef.update({
    riskLevel: assessment.riskLevel,
    urgency: assessment.urgency,
    referralRequired: assessment.referralRequired,
    aiAssessmentId: assessmentRef.id,
    doctorReviewStatus: 'pending',
    status: 'ai_assessed',
    updatedAt: now,
  });

  // Also update global visits collection (for doctor's real-time queue)
  await db.collection(COLLECTIONS.VISITS).doc(visitId).set(
    {
      riskLevel: assessment.riskLevel,
      urgency: assessment.urgency,
      referralRequired: assessment.referralRequired,
      aiAssessmentId: assessmentRef.id,
      doctorReviewStatus: 'pending',
      status: 'ai_assessed',
      updatedAt: now,
    },
    { merge: true }
  );

  console.log(`[VisitService] Assessment ${assessmentRef.id} saved for visit ${visitId}`);
  return assessmentRef.id;
}
