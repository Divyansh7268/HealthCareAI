/**
 * Vital Sign Validation Rules
 * Checks for extreme physiological outliers that indicate an immediate
 * threat to life or a data entry error.
 *
 * Source: standard clinical reference ranges (e.g., NICE, WHO guidelines).
 */

'use strict';

export const VITAL_BOUNDARIES = Object.freeze({
  temperature: { min: 32.0, max: 42.0 },
  heartRate: { min: 30, max: 200 },
  spO2: { min: 50, max: 100 },
  respiratoryRate: { min: 4, max: 60 },
});

export function validateVitals(vitals = {}) {
  const flags = [];
  
  const parse = (val) => {
    if (val === null || val === undefined || val === '') return null;
    const n = parseFloat(val);
    return isNaN(n) ? null : n;
  };

  const temp = parse(vitals.temperature);
  if (temp !== null && (temp < VITAL_BOUNDARIES.temperature.min || temp > VITAL_BOUNDARIES.temperature.max)) {
    flags.push(`Temperature ${temp}°C is an extreme outlier. Please verify measurement.`);
  }

  const hr = parse(vitals.heartRate);
  if (hr !== null && (hr < VITAL_BOUNDARIES.heartRate.min || hr > VITAL_BOUNDARIES.heartRate.max)) {
    flags.push(`Heart Rate ${hr} bpm is an extreme outlier. Please verify measurement.`);
  }

  const spO2 = parse(vitals.spO2);
  if (spO2 !== null && (spO2 < VITAL_BOUNDARIES.spO2.min || spO2 > VITAL_BOUNDARIES.spO2.max)) {
    flags.push(`SpO2 ${spO2}% is an extreme outlier. Please verify measurement.`);
  }

  const rr = parse(vitals.respiratoryRate);
  if (rr !== null && (rr < VITAL_BOUNDARIES.respiratoryRate.min || rr > VITAL_BOUNDARIES.respiratoryRate.max)) {
    flags.push(`Respiratory Rate ${rr} breaths/min is an extreme outlier. Please verify measurement.`);
  }

  return flags;
}
