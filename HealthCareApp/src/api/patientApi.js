import apiClient from './apiClient';

/**
 * GET /api/v1/patients
 * Optionally pass a query string to search.
 */
export async function searchPatients(query = '') {
  try {
    const response = await apiClient.get(`/patients?query=${encodeURIComponent(query)}`);
    return response.data; // Expected { patients: [...] }
  } catch (error) {
    throw error;
  }
}

/**
 * GET /api/v1/patients/:id
 */
export async function getPatient(patientId) {
  try {
    const response = await apiClient.get(`/patients/${patientId}`);
    return response.data; // Expected { patient: {...}, visits: [...] }
  } catch (error) {
    throw error;
  }
}

/**
 * POST /api/v1/patients
 */
export async function createPatient(patientData) {
  try {
    const response = await apiClient.post('/patients', patientData);
    return response.data; // Expected { success: true, patientId: '...' }
  } catch (error) {
    throw error;
  }
}
