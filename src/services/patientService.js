/**
 * src/services/patientService.js
 *
 * Business-logic layer for patient operations.
 * Sits between screens and the Backend REST API.
 */

import apiClient from '../api/apiClient';

export function normalisePhone(raw) {
  if (!raw) return null;
  return raw.replace(/\s|-|\(|\)/g, '').replace(/^\+?91/, '').trim();
}

/**
 * Full flow for registering a new patient and starting their first visit.
 *
 * @param {object} formData - { name, age, phone, gender? }
 * @param {string} healthWorkerUid - Included for legacy compat, backend infers from token
 * @returns {Promise<{patientId: string, visitId: string, isExistingPatient: boolean}>}
 */
export async function registerPatientAndStartVisit(formData, healthWorkerUid) {
  const normPhone = normalisePhone(formData.phone);

  // 1. Create or Find Patient via Backend
  const patientPayload = {
    name: formData.name.trim(),
    age: parseInt(formData.age, 10),
    gender: formData.gender || 'unknown',
    phone: normPhone,
  };

  const patientResponse = await apiClient.post('/patients', patientPayload);
  const patient = patientResponse.data.patient;
  const isExistingPatient = patientResponse.data.message === 'Patient already exists';

  // 2. Create Visit via Backend
  const visitPayload = {
    symptoms: [],
    vitals: {},
    bodyLocations: [],
    medicalImageRefs: [],
  };

  const visitResponse = await apiClient.post(`/patients/${patient.id}/visits`, visitPayload);
  const visit = visitResponse.data.visit;

  return { patientId: patient.id, visitId: visit.id, isExistingPatient };
}

export async function updateVisitData(patientId, visitId, updates, workerUid) {
  await apiClient.patch(`/patients/${patientId}/visits/${visitId}`, updates);
}

