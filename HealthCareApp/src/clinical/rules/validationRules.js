/**
 * Validation Rules
 * Checks for completeness of data.
 */

'use strict';

export function checkMissingInformation(vitals = {}, symptoms = '', bodyLocations = []) {
  const missing = [];

  const parse = (val) => {
    if (val === null || val === undefined || val === '') return null;
    const n = parseFloat(val);
    return isNaN(n) ? null : n;
  };

  if (!symptoms && bodyLocations.length === 0) {
    missing.push('No symptoms or body locations provided.');
  }

  if (parse(vitals.temperature) === null) missing.push('Temperature');
  if (parse(vitals.heartRate) === null) missing.push('Heart Rate');
  if (parse(vitals.spO2) === null) missing.push('SpO2');
  if (parse(vitals.respiratoryRate) === null) missing.push('Respiratory Rate');
  if (!vitals.bloodPressure) missing.push('Blood Pressure');

  return missing;
}
