/**
 * src/services/patientService.js
 *
 * Business-logic layer for patient operations.
 * Sits between screens and Firestore — screens should call these functions,
 * not call Firestore directly.
 *
 * Responsibilities:
 *   - Duplicate detection before creating a new patient
 *   - Patient creation + immediate visit creation in one transaction
 *   - Phone number normalisation (strips spaces, +91 prefix)
 *   - Structured error messages for UI consumption
 */

import {
  createPatient,
  getPatientsByWorker,
  createVisit,
  updateVisit,
  COLLECTIONS,
} from '../firebase/firestore';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

// ─────────────────────────────────────────────────────────────
// Phone normalisation
// ─────────────────────────────────────────────────────────────
export function normalisePhone(raw) {
  if (!raw) return null;
  // Strip spaces, dashes, brackets, +91 prefix
  return raw.replace(/\s|-|\(|\)/g, '').replace(/^\+?91/, '').trim();
}

// ─────────────────────────────────────────────────────────────
// Duplicate detection
// ─────────────────────────────────────────────────────────────
/**
 * Search for an existing patient by phone number across all records visible
 * to this health worker.
 *
 * @param {string} phone        - Raw phone string entered by user
 * @param {string} workerUid    - UID of the current health worker
 * @returns {object|null}       - Existing patient document or null
 */
export async function findPatientByPhone(phone, workerUid) {
  const normalised = normalisePhone(phone);
  if (!normalised || normalised.length < 10) return null;

  // Search in patients created by this worker (security rule scope)
  const q = query(
    collection(db, COLLECTIONS.PATIENTS),
    where('createdBy', '==', workerUid),
    where('phone', '==', normalised),
  );
  const snap = await getDocs(q);
  if (!snap.empty) return { id: snap.docs[0].id, ...snap.docs[0].data() };

  return null;
}

/**
 * Check for a near-duplicate by name + age within this worker's patient list.
 * Used as a secondary check when phone doesn't match.
 *
 * @returns {object|null}  - Matching patient or null
 */
export async function findPatientByNameAge(name, age, workerUid) {
  const normName = name.trim().toLowerCase();
  const normAge = parseInt(age, 10);

  const patients = await getPatientsByWorker(workerUid);
  const match = patients.find(
    p =>
      p.name?.trim().toLowerCase() === normName &&
      parseInt(p.age, 10) === normAge,
  );
  return match || null;
}

// ─────────────────────────────────────────────────────────────
// Create patient + initial visit in one operation
// ─────────────────────────────────────────────────────────────
/**
 * Full flow for registering a new patient and starting their first visit.
 *
 * Steps:
 *   1. Normalise phone
 *   2. Check for existing patient by phone → skip creation if found
 *   3. Create patient document if new
 *   4. Create a new visit linked to that patient
 *   5. Return { patientId, visitId, isExistingPatient }
 *
 * @param {object} formData          - { name, age, phone, gender? }
 * @param {string} healthWorkerUid
 * @returns {Promise<{patientId: string, visitId: string, isExistingPatient: boolean}>}
 */
export async function registerPatientAndStartVisit(formData, healthWorkerUid) {
  const normPhone = normalisePhone(formData.phone);

  // ── Step 1: Duplicate check ────────────────────────────────
  let existingPatient = await findPatientByPhone(normPhone, healthWorkerUid);
  let isExistingPatient = false;

  if (!existingPatient) {
    // Secondary check: same name + age
    existingPatient = await findPatientByNameAge(
      formData.name,
      formData.age,
      healthWorkerUid,
    );
  }

  let patientId;

  if (existingPatient) {
    // Patient already exists — reuse their record
    patientId = existingPatient.id;
    isExistingPatient = true;
  } else {
    // ── Step 2: Create new patient ───────────────────────────
    patientId = await createPatient(
      {
        name:   formData.name.trim(),
        age:    parseInt(formData.age, 10),
        gender: formData.gender || 'unknown',
        phone:  normPhone,
      },
      healthWorkerUid,
    );
  }

  // ── Step 3: Create a new visit for this encounter ──────────
  const visitId = await createVisit(
    {
      patientId,
      symptoms: [],
      vitals: {},
      bodyLocations: [],
      medicalImageRefs: [],
    },
    healthWorkerUid,
  );

  return { patientId, visitId, isExistingPatient };
}

// ─────────────────────────────────────────────────────────────
// Update visit with symptoms / vitals from AI analysis screen
// ─────────────────────────────────────────────────────────────
export async function updateVisitData(visitId, patientId, updates, workerUid) {
  await updateVisit(visitId, patientId, updates, workerUid);
}
