/**
 * src/firebase/firestore.js
 *
 * Complete Firestore data model and service functions for VirtualCare.
 *
 * Architecture principles:
 *   - Patient data is ALWAYS stored in OUR Firestore, NOT in AI provider.
 *   - AI assessments are stored as a sub-collection of visits, clearly
 *     separated from raw clinical data.
 *   - Doctor decisions are stored in their own document, never overwritten
 *     by AI output.
 *   - AI model metadata (provider, name, version) is stored with every
 *     assessment so models can be swapped without losing history.
 *
 * Collection structure:
 *
 *   users/{uid}                          — user profiles with roles
 *   patients/{patientId}                 — patient demographics
 *   patients/{patientId}/visits/{visitId} — clinical visit records
 *   visits/{visitId}/aiAssessments/{id}  — AI-generated assessments (AI output ONLY)
 *   visits/{visitId}/doctorReviews/{id}  — Doctor final decisions
 *   treatments/{treatmentId}             — prescribed treatments per visit
 *   referrals/{referralId}               — referrals to higher facilities
 *   followUps/{followUpId}               — scheduled follow-up records
 *   notifications/{notificationId}       — in-app notifications
 *   auditLogs/{logId}                    — immutable audit trail
 */

import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from './config';

// ─────────────────────────────────────────────────────────────
// Collection name constants (single source of truth)
// ─────────────────────────────────────────────────────────────
export const COLLECTIONS = {
  USERS:         'users',
  PATIENTS:      'patients',
  VISITS:        'visits',           // top-level visits for easy doctor queries
  AI_ASSESSMENTS:'aiAssessments',    // sub-collection of visits
  DOCTOR_REVIEWS:'doctorReviews',    // sub-collection of visits
  TREATMENTS:    'treatments',
  REFERRALS:     'referrals',
  FOLLOW_UPS:    'followUps',
  NOTIFICATIONS: 'notifications',
  AUDIT_LOGS:    'auditLogs',
};

// ─────────────────────────────────────────────────────────────
// Vitals schema (for documentation / validation reference)
// ─────────────────────────────────────────────────────────────
// {
//   temperature:      number (°C),
//   bloodPressureSys: number (mmHg),
//   bloodPressureDia: number (mmHg),
//   heartRate:        number (bpm),
//   spo2:             number (%),
//   respiratoryRate:  number (breaths/min),
//   weight:           number (kg),
//   recordedAt:       Timestamp,
// }

// ─────────────────────────────────────────────────────────────
// Body location schema (for documentation reference)
// ─────────────────────────────────────────────────────────────
// {
//   bodyRegion:  string  (e.g. 'chest', 'abdomen', 'head'),
//   side:        string  ('left' | 'right' | 'central' | 'bilateral'),
//   coordinates: object  ({ x: number, y: number }) — from body diagram,
//   complaint:   string  (patient-reported complaint for this region),
//   severity:    string  ('mild' | 'moderate' | 'severe'),
// }

// ─────────────────────────────────────────────────────────────
// USERS
// ─────────────────────────────────────────────────────────────
export async function getUserById(uid) {
  const snap = await getDoc(doc(db, COLLECTIONS.USERS, uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function updateUserProfile(uid, updates) {
  await updateDoc(doc(db, COLLECTIONS.USERS, uid), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

// ─────────────────────────────────────────────────────────────
// PATIENTS
// ─────────────────────────────────────────────────────────────

/**
 * Create a new patient record.
 * @param {object} patientData - { name, age, gender, phone, village, district, ... }
 * @param {string} createdByUid - UID of the health worker creating this record
 * @returns {Promise<string>} patientId
 */
export async function createPatient(patientData, createdByUid) {
  const data = {
    name:          patientData.name,
    age:           patientData.age,
    gender:        patientData.gender,             // 'male' | 'female' | 'other'
    phone:         patientData.phone || null,
    village:       patientData.village || null,
    district:      patientData.district || null,
    state:         patientData.state || null,
    bloodGroup:    patientData.bloodGroup || null,
    allergies:     patientData.allergies || [],
    chronicConditions: patientData.chronicConditions || [],
    emergencyContact: patientData.emergencyContact || null,
    createdBy:     createdByUid,
    createdAt:     serverTimestamp(),
    updatedAt:     serverTimestamp(),
    isActive:      true,
  };
  const ref = await addDoc(collection(db, COLLECTIONS.PATIENTS), data);
  await writeAuditLog({ action: 'patient_created', patientId: ref.id, uid: createdByUid });
  return ref.id;
}

export async function getPatientById(patientId) {
  const snap = await getDoc(doc(db, COLLECTIONS.PATIENTS, patientId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function getPatientsByWorker(workerUid) {
  const q = query(
    collection(db, COLLECTIONS.PATIENTS),
    where('createdBy', '==', workerUid),
  );
  const snap = await getDocs(q);
  const patients = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  
  // Sort by createdAt descending locally to avoid requiring a composite index
  return patients.sort((a, b) => {
    const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
    const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
    return timeB - timeA;
  });
}

export async function searchPatients(workerUid, searchText) {
  // Firestore doesn't support full-text search — fetch all and filter client-side
  const patients = await getPatientsByWorker(workerUid);
  const lower = searchText.toLowerCase();
  return patients.filter(p =>
    p.name?.toLowerCase().includes(lower) ||
    p.phone?.includes(searchText),
  );
}

export async function updatePatient(patientId, updates, updatedByUid) {
  await updateDoc(doc(db, COLLECTIONS.PATIENTS, patientId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
  await writeAuditLog({ action: 'patient_updated', patientId, uid: updatedByUid });
}

// ─────────────────────────────────────────────────────────────
// VISITS  (stored at top-level AND as sub-collection of patient)
// ─────────────────────────────────────────────────────────────

/**
 * Create a new visit record.
 * Stored in both: /visits/{visitId} and /patients/{patientId}/visits/{visitId}
 *
 * @param {object} visitData
 * @param {string} healthWorkerUid
 * @returns {Promise<string>} visitId
 */
export async function createVisit(visitData, healthWorkerUid) {
  const data = {
    patientId:          visitData.patientId,
    healthWorkerId:     healthWorkerUid,
    clinicId:           visitData.clinicId || null,

    // Clinical data
    symptoms:           visitData.symptoms || [],          // string[]
    chiefComplaint:     visitData.chiefComplaint || null,
    voiceTranscript:    visitData.voiceTranscript || null, // raw transcription
    bodyLocations:      visitData.bodyLocations || [],     // BodyLocation[]
    medicalImageRefs:   visitData.medicalImageRefs || [],  // Storage path strings

    // Structured vitals object
    vitals: {
      temperature:      visitData.vitals?.temperature      || null,
      bloodPressureSys: visitData.vitals?.bloodPressureSys || null,
      bloodPressureDia: visitData.vitals?.bloodPressureDia || null,
      heartRate:        visitData.vitals?.heartRate        || null,
      spo2:             visitData.vitals?.spo2             || null,
      respiratoryRate:  visitData.vitals?.respiratoryRate  || null,
      weight:           visitData.vitals?.weight           || null,
      recordedAt:       serverTimestamp(),
    },

    // Status tracking
    status:             'draft',        // draft → submitted → ai_analyzed → pending_doctor → completed
    riskLevel:          null,           // set after AI analysis: 'low' | 'medium' | 'high' | 'critical'
    doctorReviewStatus: 'not_required', // not_required | pending | approved | rejected | needs_info

    createdAt:          serverTimestamp(),
    updatedAt:          serverTimestamp(),
  };

  // Write to top-level /visits for doctor queries
  const ref = await addDoc(collection(db, COLLECTIONS.VISITS), data);
  const visitId = ref.id;

  // Mirror to patient sub-collection for patient history queries
  await setDoc(
    doc(db, COLLECTIONS.PATIENTS, visitData.patientId, COLLECTIONS.VISITS, visitId),
    { visitId, ...data },
  );

  await writeAuditLog({ action: 'visit_created', visitId, patientId: visitData.patientId, uid: healthWorkerUid });
  return visitId;
}

export async function getVisitById(visitId) {
  const snap = await getDoc(doc(db, COLLECTIONS.VISITS, visitId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function getVisitsByPatient(patientId) {
  const q = query(
    collection(db, COLLECTIONS.PATIENTS, patientId, COLLECTIONS.VISITS),
    orderBy('createdAt', 'desc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function updateVisit(visitId, patientId, updates, updatedByUid) {
  const update = { ...updates, updatedAt: serverTimestamp() };
  await updateDoc(doc(db, COLLECTIONS.VISITS, visitId), update);
  // Mirror update to sub-collection
  await updateDoc(doc(db, COLLECTIONS.PATIENTS, patientId, COLLECTIONS.VISITS, visitId), update);
  await writeAuditLog({ action: 'visit_updated', visitId, uid: updatedByUid });
}

/** Doctor live feed — all visits pending their review */
export function subscribePendingDoctorVisits(callback) {
  const q = query(
    collection(db, COLLECTIONS.VISITS),
    where('doctorReviewStatus', '==', 'pending'),
    orderBy('createdAt', 'desc'),
    limit(50),
  );
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

// ─────────────────────────────────────────────────────────────
// AI ASSESSMENTS  (sub-collection of visits)
// IMPORTANT: AI output is NEVER the source of truth for medical decisions.
// ─────────────────────────────────────────────────────────────

/**
 * Save an AI-generated assessment.
 * Stores full model metadata so models can be replaced without losing history.
 *
 * @param {string} visitId
 * @param {object} assessmentData
 * @returns {Promise<string>} assessmentId
 */
export async function saveAIAssessment(visitId, assessmentData) {
  const data = {
    visitId,

    // AI model metadata — makes assessments auditable when model changes
    modelProvider:  assessmentData.modelProvider,  // e.g. 'google'
    modelName:      assessmentData.modelName,       // e.g. 'gemini-1.5-pro'
    modelVersion:   assessmentData.modelVersion,    // e.g. '001'

    // AI output — for clinical support ONLY, not medical decisions
    riskLevel:              assessmentData.riskLevel,        // 'low'|'medium'|'high'|'critical'
    possibleConditions:     assessmentData.possibleConditions || [],   // { name, confidence }[]
    redFlags:               assessmentData.redFlags || [],
    supportingFindings:     assessmentData.supportingFindings || [],
    missingInformation:     assessmentData.missingInformation || [],
    recommendedNextStep:    assessmentData.recommendedNextStep || null,
    doctorReviewRequired:   assessmentData.doctorReviewRequired ?? true,
    reasoning:              assessmentData.reasoning || null,       // AI chain of thought
    rawResponse:            assessmentData.rawResponse || null,     // full raw AI response (for debugging)

    // Status — only doctor can change this to 'approved' or 'rejected'
    status: 'ai_draft',   // ai_draft → approved | rejected | superseded

    createdAt: serverTimestamp(),
  };

  const ref = await addDoc(
    collection(db, COLLECTIONS.VISITS, visitId, COLLECTIONS.AI_ASSESSMENTS),
    data,
  );

  // Update parent visit status
  await updateDoc(doc(db, COLLECTIONS.VISITS, visitId), {
    status: 'ai_analyzed',
    riskLevel: assessmentData.riskLevel,
    doctorReviewStatus: assessmentData.doctorReviewRequired ? 'pending' : 'not_required',
    updatedAt: serverTimestamp(),
  });

  await writeAuditLog({ action: 'ai_assessment_saved', visitId, assessmentId: ref.id });
  return ref.id;
}

export async function getAIAssessmentsByVisit(visitId) {
  const q = query(
    collection(db, COLLECTIONS.VISITS, visitId, COLLECTIONS.AI_ASSESSMENTS),
    orderBy('createdAt', 'desc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ─────────────────────────────────────────────────────────────
// DOCTOR REVIEWS  (sub-collection of visits)
// This is the AUTHORITATIVE medical decision — separate from AI output.
// ─────────────────────────────────────────────────────────────

/**
 * Save doctor's final clinical decision.
 * This is the source of truth — NOT the AI assessment.
 *
 * @param {string} visitId
 * @param {string} doctorUid
 * @param {object} reviewData
 * @returns {Promise<string>} reviewId
 */
export async function saveDoctorReview(visitId, doctorUid, reviewData) {
  const data = {
    visitId,
    doctorUid,

    // Doctor's clinical decision
    finalDecision:       reviewData.finalDecision,      // 'approved' | 'rejected' | 'modified'
    diagnosis:           reviewData.diagnosis || null,
    treatmentPlan:       reviewData.treatmentPlan || null,
    medications:         reviewData.medications || [],
    doctorNotes:         reviewData.doctorNotes || null,

    // Did doctor agree with AI?
    aiAssessmentUsed:    reviewData.aiAssessmentId || null,  // which AI assessment was reviewed
    agreedWithAI:        reviewData.agreedWithAI ?? null,    // true | false | null
    aiOverrideReason:    reviewData.aiOverrideReason || null,

    // Referral / escalation decision
    referralRequired:    reviewData.referralRequired ?? false,
    referralDetails:     reviewData.referralDetails || null,

    // Follow-up
    followUpRequired:    reviewData.followUpRequired ?? false,
    followUpInDays:      reviewData.followUpInDays || null,

    reviewedAt: serverTimestamp(),
    createdAt:  serverTimestamp(),
  };

  const ref = await addDoc(
    collection(db, COLLECTIONS.VISITS, visitId, COLLECTIONS.DOCTOR_REVIEWS),
    data,
  );

  // Update visit status to completed with doctor's decision
  await updateDoc(doc(db, COLLECTIONS.VISITS, visitId), {
    status: 'completed',
    doctorReviewStatus: reviewData.finalDecision === 'rejected' ? 'rejected' : 'approved',
    reviewedBy: doctorUid,
    reviewedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await writeAuditLog({
    action: 'doctor_review_saved',
    visitId,
    reviewId: ref.id,
    uid: doctorUid,
    decision: reviewData.finalDecision,
  });
  return ref.id;
}

export async function getDoctorReviewsByVisit(visitId) {
  const q = query(
    collection(db, COLLECTIONS.VISITS, visitId, COLLECTIONS.DOCTOR_REVIEWS),
    orderBy('createdAt', 'desc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ─────────────────────────────────────────────────────────────
// TREATMENTS
// ─────────────────────────────────────────────────────────────
export async function createTreatment(treatmentData, prescribedByUid) {
  const data = {
    visitId:       treatmentData.visitId,
    patientId:     treatmentData.patientId,
    prescribedBy:  prescribedByUid,
    medications:   treatmentData.medications || [],   // { name, dose, frequency, duration }[]
    instructions:  treatmentData.instructions || null,
    startDate:     treatmentData.startDate || serverTimestamp(),
    endDate:       treatmentData.endDate || null,
    status:        'active',   // active | completed | discontinued
    createdAt:     serverTimestamp(),
  };
  const ref = await addDoc(collection(db, COLLECTIONS.TREATMENTS), data);
  await writeAuditLog({ action: 'treatment_created', visitId: treatmentData.visitId, uid: prescribedByUid });
  return ref.id;
}

export async function getTreatmentsByVisit(visitId) {
  const q = query(collection(db, COLLECTIONS.TREATMENTS), where('visitId', '==', visitId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ─────────────────────────────────────────────────────────────
// REFERRALS
// ─────────────────────────────────────────────────────────────
export async function createReferral(referralData, createdByUid) {
  const data = {
    visitId:          referralData.visitId,
    patientId:        referralData.patientId,
    referredBy:       createdByUid,
    referredTo:       referralData.referredTo,      // facility name or doctor name
    facilityType:     referralData.facilityType,    // 'PHC' | 'CHC' | 'district_hospital' | 'specialist'
    speciality:       referralData.speciality || null,
    urgency:          referralData.urgency || 'routine',  // 'emergency' | 'urgent' | 'routine'
    reason:           referralData.reason,
    transportNeeded:  referralData.transportNeeded ?? false,
    status:           'pending',   // pending | accepted | completed | cancelled
    createdAt:        serverTimestamp(),
    updatedAt:        serverTimestamp(),
  };
  const ref = await addDoc(collection(db, COLLECTIONS.REFERRALS), data);
  await writeAuditLog({ action: 'referral_created', visitId: referralData.visitId, uid: createdByUid });
  return ref.id;
}

export async function getReferralsByPatient(patientId) {
  const q = query(
    collection(db, COLLECTIONS.REFERRALS),
    where('patientId', '==', patientId),
    orderBy('createdAt', 'desc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ─────────────────────────────────────────────────────────────
// FOLLOW-UPS
// ─────────────────────────────────────────────────────────────
export async function scheduleFollowUp(followUpData, scheduledByUid) {
  const data = {
    visitId:       followUpData.visitId,
    patientId:     followUpData.patientId,
    scheduledBy:   scheduledByUid,
    scheduledDate: followUpData.scheduledDate,    // Timestamp
    reason:        followUpData.reason || null,
    notes:         followUpData.notes || null,
    status:        'scheduled',   // scheduled | completed | missed | cancelled
    createdAt:     serverTimestamp(),
  };
  const ref = await addDoc(collection(db, COLLECTIONS.FOLLOW_UPS), data);
  return ref.id;
}

export async function getUpcomingFollowUps(workerUid) {
  const now = Timestamp.now();
  const q = query(
    collection(db, COLLECTIONS.FOLLOW_UPS),
    where('scheduledBy', '==', workerUid),
    where('status', '==', 'scheduled'),
    where('scheduledDate', '>=', now),
    orderBy('scheduledDate', 'asc'),
    limit(20),
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ─────────────────────────────────────────────────────────────
// NOTIFICATIONS
// ─────────────────────────────────────────────────────────────
export async function createNotification(recipientUid, notificationData) {
  const data = {
    recipientUid,
    type:      notificationData.type,     // 'review_required' | 'review_done' | 'follow_up' | 'referral_update'
    title:     notificationData.title,
    message:   notificationData.message,
    data:      notificationData.data || {},   // extra payload e.g. { visitId, patientId }
    isRead:    false,
    createdAt: serverTimestamp(),
  };
  await addDoc(collection(db, COLLECTIONS.NOTIFICATIONS), data);
}

export function subscribeNotifications(uid, callback) {
  const q = query(
    collection(db, COLLECTIONS.NOTIFICATIONS),
    where('recipientUid', '==', uid),
    where('isRead', '==', false),
    orderBy('createdAt', 'desc'),
    limit(20),
  );
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

export async function markNotificationRead(notificationId) {
  await updateDoc(doc(db, COLLECTIONS.NOTIFICATIONS, notificationId), { isRead: true });
}

// ─────────────────────────────────────────────────────────────
// AUDIT LOGS  (write-only from client — immutable)
// ─────────────────────────────────────────────────────────────
export async function writeAuditLog(logData) {
  try {
    await addDoc(collection(db, COLLECTIONS.AUDIT_LOGS), {
      ...logData,
      timestamp: serverTimestamp(),
    });
  } catch {
    // Audit log failures must NEVER crash the app
    console.warn('[AuditLog] Failed to write:', logData);
  }
}
