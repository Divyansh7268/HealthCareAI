/**
 * Offline Clinical Assessment
 *
 * Coordinates NEWS2, GCS, Rule Engine, and local Trend comparison
 * into a single unified offline risk summary.
 */

'use strict';

import { calculateNEWS2, parseVitalsForNEWS2 } from './news2/news2Calculator';
import { runOfflineRuleEngine } from './rules/ruleEngine';
// GCS is calculated manually by HW, but if we had it in vitals, we'd calculate it here.
// For now, GCS is just passed through if available.

/**
 * Compute the overall offline clinical risk summary.
 *
 * @param {object} visitData - Contains vitals, symptoms, bodyLocations, etc.
 * @param {object} localHistory - The local SQLite history of this patient (if available).
 * @returns {object} The structured offline assessment.
 */
export function computeOfflineAssessment(visitData, localHistory = null) {
  const { vitals = {}, symptoms = '', additionalNotes = '' } = visitData || {};

  // 1. Calculate NEWS2
  // We assume no supplemental O2 by default in offline mode unless specified
  const news2Input = parseVitalsForNEWS2(vitals, null, false);
  const news2Result = calculateNEWS2(news2Input);

  // 2. Run Offline Rule Engine
  const ruleResult = runOfflineRuleEngine(visitData);

  // 3. Determine Overall Status
  let overallStatus = 'No immediate red flag detected';
  let doctorReviewRequired = false;

  const hasRedFlags = ruleResult.severity === 'emergency';
  const hasWarning = ruleResult.severity === 'warning';
  
  if (news2Result.escalationFlag || hasRedFlags) {
    overallStatus = 'Emergency review recommended';
    doctorReviewRequired = true;
  } else if (news2Result.riskCategory === 'Medium' || hasWarning) {
    overallStatus = 'Urgent review recommended';
    doctorReviewRequired = true;
  } else if (news2Result.riskCategory === 'Unable to assess — insufficient data' && ruleResult.missingInformation.length > 0) {
    overallStatus = 'Unable to assess due to missing information';
  } else if (news2Result.riskCategory === 'Low-Medium') {
    overallStatus = 'Clinical concern';
    doctorReviewRequired = true;
  }

  // Combine limitations
  const limitations = [
    'Offline clinical support is based on configured rules and clinical scoring tools (NEWS2).',
    'Full AI assessment will be available after synchronization.',
  ];

  if (!news2Result.isComplete) {
    limitations.push(`Missing vital signs for complete NEWS2 score: ${news2Result.missingInputs.join(', ')}`);
  }

  return {
    mode: 'offline',
    news2: news2Result,
    gcs: null, // Placeholder for GCS integration if added to intake UI
    redFlags: ruleResult.flags,
    missingInformation: ruleResult.missingInformation,
    trend: {
      overallTrend: 'unclear', // Offline trend comparison to be implemented in Sync phase
      summary: 'Trend comparison requires local history (not fully implemented offline yet).'
    },
    overallStatus,
    doctorReviewRequired,
    limitations,
  };
}
