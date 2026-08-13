/**
 * GCS Calculator
 *
 * Reference:
 *   Teasdale G, Jennett B. Assessment of coma and impaired consciousness.
 *   Lancet. 1974 Jul 13;2(7872):81-4.
 *
 * IMPORTANT:
 *   GCS is a clinical scoring tool for assessing the depth and duration
 *   of impaired consciousness and coma. It is not a diagnosis.
 */

'use strict';

import { validateGCSComponent, interpretGCS } from './gcsRules';

/**
 * Calculate the total GCS score and interpretation.
 *
 * @param {import('./gcsTypes').GCSInput} input
 * @returns {import('./gcsTypes').GCSResult}
 */
export function calculateGCS(input) {
  const { eye, verbal, motor } = input || {};

  const missingComponents = [];
  const errors = [];

  // Validate Eye
  const eyeVal = validateGCSComponent('eye', eye);
  if (!eyeVal.valid) {
    if (eyeVal.error.includes('missing')) missingComponents.push('Eye Response');
    else errors.push(eyeVal.error);
  }

  // Validate Verbal
  const verbalVal = validateGCSComponent('verbal', verbal);
  if (!verbalVal.valid) {
    if (verbalVal.error.includes('missing')) missingComponents.push('Verbal Response');
    else errors.push(verbalVal.error);
  }

  // Validate Motor
  const motorVal = validateGCSComponent('motor', motor);
  if (!motorVal.valid) {
    if (motorVal.error.includes('missing')) missingComponents.push('Motor Response');
    else errors.push(motorVal.error);
  }

  const isComplete = missingComponents.length === 0 && errors.length === 0;
  
  let total = null;
  let interpretation = 'Unable to interpret — incomplete data';

  if (isComplete) {
    total = Number(eye) + Number(verbal) + Number(motor);
    interpretation = interpretGCS(total);
  }

  return {
    eye: isComplete ? Number(eye) : null,
    verbal: isComplete ? Number(verbal) : null,
    motor: isComplete ? Number(motor) : null,
    total,
    interpretation,
    isComplete,
    missingComponents,
    errors,
    disclaimer: 'The Glasgow Coma Scale is a clinical tool used to objectively measure conscious state. It does not replace comprehensive neurological assessment.',
  };
}
