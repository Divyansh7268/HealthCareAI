/**
 * Offline Rule Engine
 * Evaluates vitals, symptoms, and completeness without AI.
 */

'use strict';

import { validateVitals } from './vitalRules';
import { checkRedFlags } from './redFlagRules';
import { checkMissingInformation } from './validationRules';

/**
 * Run the offline deterministic rule engine.
 *
 * @param {object} visitData
 * @param {object} visitData.vitals
 * @param {string} visitData.symptoms
 * @param {string} visitData.additionalNotes
 * @param {Array} visitData.bodyLocations
 * @returns {object} { severity: string, flags: string[], missingInformation: string[], triggeredRules: string[] }
 */
export function runOfflineRuleEngine(visitData) {
  const {
    vitals = {},
    symptoms = '',
    additionalNotes = '',
    bodyLocations = []
  } = visitData || {};

  const missingInformation = checkMissingInformation(vitals, symptoms, bodyLocations);
  const vitalFlags = validateVitals(vitals);
  const redFlags = checkRedFlags(symptoms, additionalNotes);

  const allFlags = [...vitalFlags, ...redFlags];

  let severity = 'normal';
  if (redFlags.length > 0) {
    severity = 'emergency';
  } else if (vitalFlags.length > 0) {
    severity = 'warning';
  }

  return {
    severity,
    flags: allFlags,
    missingInformation,
    triggeredRules: allFlags.length > 0 ? ['Clinical outlier or red flag detected'] : [],
  };
}
