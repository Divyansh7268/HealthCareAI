/**
 * src/api/visitApi.js
 * 
 * Frontend API client for calling the VirtualCare backend.
 */

import apiClient from './apiClient';

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

