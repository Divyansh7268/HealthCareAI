/**
 * Visit Service
 * 
 * Backend service layer for patient/visit operations.
 * Uses Firebase Admin SDK (full Firestore access, bypasses security rules).
 */

import { db } from '../config/firebase';
import { FieldValue } from 'firebase-admin/firestore';
import { RuleEngineOutput } from '../rules/ruleEngine';
import { AIAssessmentResult } from '../ai/aiSchema';
import { TrendResult } from './trendService';

import { COLLECTIONS } from '../config/collections';

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
  ruleResult: RuleEngineOutput,
  assessedByUserId: string,
  trendResult?: TrendResult
): Promise<string> {
  const now = FieldValue.serverTimestamp();

  // 1. Determine assessmentVersion by checking existing assessments for this visit
  const existingAssessmentsSnap = await db.collection(COLLECTIONS.AI_ASSESSMENTS)
    .where('visitId', '==', visitId)
    .get();
  
  let nextVersionNum = 1;
  if (!existingAssessmentsSnap.empty) {
    // Parse version strings (e.g., 'v1', 'v2') and find the max
    const versions = existingAssessmentsSnap.docs.map(doc => {
      const vString = doc.data().assessmentVersion || 'v0';
      return parseInt(vString.replace('v', ''), 10) || 0;
    });
    nextVersionNum = Math.max(...versions) + 1;
  }
  
  const assessmentVersion = `v${nextVersionNum}`;

  const assessmentData = {
    patientId,
    visitId,
    assessedByUserId,
    assessedAt: now,
    createdAt: now, // Explicit createdAt requested
    
    // Explicit Audit fields requested by user
    assessmentVersion,
    modelProvider: 'Google',
    modelName: 'Gemini',
    modelVersion: 'gemini-1.5-pro',
    promptVersion: 'v2',
    
    // AI output (New schema)
    assessmentStatus: assessment.assessmentStatus,
    riskLevel: assessment.riskLevel,
    possibleConditions: assessment.possibleConditions,
    redFlags: assessment.redFlags,
    missingInformation: assessment.missingInformation,
    currentSymptomsSummary: assessment.currentSymptomsSummary,
    trendAssessment: assessment.trendAssessment,
    recommendedNextStep: assessment.recommendedNextStep,
    doctorReviewRequired: assessment.doctorReviewRequired,
    limitations: assessment.limitations,
    // Rule engine flags for traceability
    ruleEngineFlags: ruleResult.ruleTriggered,
    ruleEngineCritical: ruleResult.critical,
    // Longitudinal trend (factual, computed before AI call)
    longitudinalTrend: trendResult ?? null,
    status: 'pending_review',
  };

  // Write to global aiAssessments collection (Idempotent: creates a new document instead of overwriting)
  const assessmentRef = await db.collection(COLLECTIONS.AI_ASSESSMENTS).add(assessmentData);

  // Update the visit record with key summary fields
  const visitRef = db
    .collection(COLLECTIONS.PATIENTS)
    .doc(patientId)
    .collection(COLLECTIONS.VISITS)
    .doc(visitId);

  await visitRef.update({
    riskLevel: assessment.riskLevel,
    urgency: assessment.riskLevel === 'emergency' ? 'emergency' : 'routine',
    referralRequired: assessment.doctorReviewRequired,
    aiAssessmentId: assessmentRef.id,
    doctorReviewStatus: 'review_required',
    status: 'ai_assessed',
    updatedAt: now,
  });

  // Also update global visits collection (for doctor's real-time queue)
  await db.collection(COLLECTIONS.VISITS).doc(visitId).set(
    {
      riskLevel: assessment.riskLevel,
      urgency: assessment.riskLevel === 'emergency' ? 'emergency' : 'routine',
      referralRequired: assessment.doctorReviewRequired,
      aiAssessmentId: assessmentRef.id,
      doctorReviewStatus: 'review_required',
      status: 'ai_assessed',
      updatedAt: now,
    },
    { merge: true }
  );

  console.log(`[VisitService] Assessment ${assessmentRef.id} saved for visit ${visitId}`);
  return assessmentRef.id;
}
