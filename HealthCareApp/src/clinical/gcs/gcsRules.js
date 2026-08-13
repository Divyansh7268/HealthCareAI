/**
 * GCS Validation Rules
 * Validates individual component ranges as defined by Teasdale & Jennett 1974.
 */
'use strict';

/** Valid ranges for each GCS component */
export const GCS_RANGES = Object.freeze({
  eye:    { min: 1, max: 4 },
  verbal: { min: 1, max: 5 },
  motor:  { min: 1, max: 6 },
});

/**
 * Validate a single GCS component value.
 * @param {'eye'|'verbal'|'motor'} component
 * @param {any} value
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateGCSComponent(component, value) {
  const range = GCS_RANGES[component];
  if (!range) return { valid: false, error: `Unknown component: ${component}` };
  if (value === null || value === undefined) return { valid: false, error: `${component} is missing` };
  const n = Number(value);
  if (isNaN(n) || !Number.isInteger(n)) return { valid: false, error: `${component} must be an integer` };
  if (n < range.min || n > range.max) {
    return { valid: false, error: `${component} must be between ${range.min} and ${range.max}` };
  }
  return { valid: true };
}

/**
 * Interpret total GCS score.
 * Uses severity categories from common clinical usage (see gcsTypes.js for references).
 * @param {number} total
 * @returns {string}
 */
export function interpretGCS(total) {
  if (total === null || total === undefined || isNaN(total)) {
    return 'Unable to interpret — incomplete data';
  }
  if (total <= 8)  return 'Severe impairment — urgent clinical assessment required';
  if (total <= 12) return 'Moderate impairment — clinical assessment required';
  if (total === 15) return 'Normal';
  return 'Mild impairment — clinical assessment recommended';
}
