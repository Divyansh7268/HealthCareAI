/**
 * src/api/visitApi.js
 * 
 * Frontend API client for calling the VirtualCare backend.
 */

import apiClient from './apiClient';
import * as FileSystem from 'expo-file-system';

/**
 * POST /api/v1/visits/:visitId/analyze
 * 
 * Sends the complete patient assessment payload to the backend.
 * @param {string} visitId
 * @param {object} payload - Complete assessment data
 * @returns {object} { assessmentId, assessment, ruleEngineFlags }
 */
export async function analyzeVisit(visitId, payload) {
  try {
    const response = await apiClient.post(`/visits/${visitId}/analyze`, payload);
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      const err = new Error(error.response.data.error || 'API error');
      err.ruleEngineResult = error.response.data.ruleEngineResult;
      err.status = error.response.status;
      throw err;
    }
    throw error;
  }
}

/**
 * POST /api/v1/patients/:patientId/visits
 * 
 * Creates a new visit for a patient.
 * @param {string} patientId 
 * @param {object} payload - Additional visit info (like clinicId)
 */
export async function createVisit(patientId, payload = {}) {
  try {
    const response = await apiClient.post(`/patients/${patientId}/visits`, payload);
    return response.data; // Should return { success, visitId }
  } catch (error) {
    throw error;
  }
}

/**
 * Helper to upload a file using Signed URLs.
 * Uses binary upload mode (not multipart) to work with GCS signed URLs.
 */
export async function uploadFile(visitId, patientId, fileUri, fileType = 'image', mimeType = 'image/jpeg') {
  try {
    console.log(`[uploadFile] Starting upload: type=${fileType}, mime=${mimeType}, uri=${fileUri}`);
    
    // 1. Get Signed URL from Backend
    const initRes = await apiClient.post(`/visits/${visitId}/uploads/init`, {
      patientId,
      fileType,
      mimeType,
    });
    const { uploadUrl, fileId, storagePath } = initRes.data;
    console.log(`[uploadFile] Got signed URL, fileId=${fileId}`);

    // 2. Upload file bytes directly to signed URL
    // FileSystem.uploadAsync with BINARY_DATA is needed for GCS signed URLs
    const uploadResult = await FileSystem.uploadAsync(uploadUrl, fileUri, {
      httpMethod: 'PUT',
      uploadType: 0, // 0 = BINARY_CONTENT, 1 = MULTIPART
      headers: {
        'Content-Type': mimeType,
      },
    });

    console.log(`[uploadFile] Upload status: ${uploadResult.status}`);
    if (uploadResult.status < 200 || uploadResult.status >= 300) {
      throw new Error(`Upload to storage failed with status: ${uploadResult.status}. Body: ${uploadResult.body}`);
    }

    // 3. Complete Upload - tell backend file is uploaded (include ALL required fields)
    await apiClient.post(`/visits/${visitId}/uploads/complete`, {
      fileId,
      storagePath,
      patientId,
      fileType,
      mimeType,
    });
    console.log(`[uploadFile] Upload completed. fileId=${fileId}`);

    return { fileId, storagePath };
  } catch (error) {
    console.error('[uploadFile] error:', error?.response?.data || error?.message || error);
    throw error;
  }
}

/**
 * Trigger audio transcription for an uploaded audio file.
 */
export async function transcribeAudio(visitId, fileId, storagePath) {
  try {
    const response = await apiClient.post(`/visits/${visitId}/transcribe`, {
      fileId,
      storagePath
    });
    return response.data;
  } catch (error) {
    console.error('[transcribeAudio] error:', error?.response?.status, error?.response?.data || error?.message);
    throw error;
  }
}

