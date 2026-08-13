import { db } from '../config/firebase';
import { COLLECTIONS } from '../config/collections';
import { FieldValue } from 'firebase-admin/firestore';
import { createAuditLog } from './auditService';
import { buildClinicalContext } from './clinicalContextService';

/**
 * Fetch comprehensive case details for the doctor dashboard
 */
export async function getCaseDetails(visitId: string) {
  // 1. Fetch visit from global visits collection
  const visitDoc = await db.collection(COLLECTIONS.VISITS).doc(visitId).get();
  if (!visitDoc.exists) {
    throw new Error('Visit not found');
  }
  const visitData = visitDoc.data()!;
  const patientId = visitData.patientId;

  // 2. Fetch Patient Profile
  const patientDoc = await db.collection(COLLECTIONS.PATIENTS).doc(patientId).get();
  const patientProfile = patientDoc.exists ? patientDoc.data() : {};

  // 3. Fetch latest AI assessment for this visit
  const aiAssessmentsSnap = await db.collection(COLLECTIONS.AI_ASSESSMENTS)
    .where('visitId', '==', visitId)
    .orderBy('createdAt', 'desc')
    .limit(1)
    .get();
  
  const aiAssessment = !aiAssessmentsSnap.empty ? {
    id: aiAssessmentsSnap.docs[0].id,
    ...aiAssessmentsSnap.docs[0].data()
  } : null;

  // 4. Fetch uploads (images, audio)
  const uploadsSnap = await db.collection(COLLECTIONS.PATIENTS)
    .doc(patientId)
    .collection(COLLECTIONS.VISITS)
    .doc(visitId)
    .collection('uploads')
    .get();
    
  const uploads = uploadsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  // 5. Build longitudinal context (previous visits, trends, etc)
  const clinicalContext = await buildClinicalContext(patientId, visitId);

  return {
    patientProfile,
    currentVisit: visitData,
    aiAssessment,
    uploads,
    history: clinicalContext,
  };
}

export async function getPatientHistory(patientId: string) {
  const patientDoc = await db.collection(COLLECTIONS.PATIENTS).doc(patientId).get();
  if (!patientDoc.exists) throw new Error('Patient not found');
  
  const clinicalContext = await buildClinicalContext(patientId); // Pass undefined for currentVisitId to get all
  return {
    patientProfile: patientDoc.data(),
    history: clinicalContext
  };
}

/**
 * Record a doctor's review action and maintain strict auditability
 */
export async function recordDoctorReview(
  visitId: string, 
  patientId: string,
  doctorId: string, 
  action: 'approved' | 'rejected' | 'edited' | 'requested_info',
  payload: {
    originalAiAssessmentId?: string;
    finalAssessment?: string;
    editedAssessment?: Record<string, any>;
    notes?: string;
    reason?: string;
  }
) {
  const now = FieldValue.serverTimestamp();
  
  const reviewRecord = {
    doctorId,
    action,
    timestamp: now,
    ...payload
  };

  // 1. Create permanent review record in doctorReviews subcollection
  const reviewRef = await db.collection(COLLECTIONS.PATIENTS)
    .doc(patientId)
    .collection(COLLECTIONS.VISITS)
    .doc(visitId)
    .collection('doctorReviews')
    .add(reviewRecord);

  // 2. Update Visit Status
  let newVisitStatus = action === 'approved' ? 'completed' 
                     : action === 'rejected' ? 'rejected'
                     : action === 'edited' ? 'completed'
                     : 'info_requested';

  const visitRef = db.collection(COLLECTIONS.PATIENTS)
    .doc(patientId)
    .collection(COLLECTIONS.VISITS)
    .doc(visitId);

  await visitRef.update({
    doctorReviewStatus: action,
    status: newVisitStatus,
    updatedAt: now
  });

  // Also update global visits
  await db.collection(COLLECTIONS.VISITS).doc(visitId).update({
    doctorReviewStatus: action,
    status: newVisitStatus,
    updatedAt: now
  });

  // 3. Create Audit Log
  const auditActionMap: Record<string, any> = {
    'approved': 'DOCTOR_APPROVED',
    'rejected': 'DOCTOR_REJECTED',
    'edited': 'DOCTOR_EDITED',
    'requested_info': 'DOCTOR_REQUESTED_INFO'
  };

  await createAuditLog(auditActionMap[action], doctorId, visitId, {
    patientId,
    reviewId: reviewRef.id,
    originalAiAssessmentId: payload.originalAiAssessmentId
  });

  return reviewRef.id;
}
