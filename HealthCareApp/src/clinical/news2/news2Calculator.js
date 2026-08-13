/**
 * NEWS2 Calculator
 *
 * Reference:
 *   Royal College of Physicians. National Early Warning Score (NEWS) 2.
 *   London: RCP, 2017. ISBN: 978-1-86016-713-5
 *
 * This calculator implements NEWS2 Scale 1 (standard).
 * Scale 2 (hypercapnic respiratory failure) is available as a separate export.
 *
 * IMPORTANT:
 *   NEWS2 is a risk-stratification tool, NOT a diagnostic tool.
 *   A high score indicates the patient requires urgent clinical assessment.
 *   It does NOT diagnose any condition.
 */

'use strict';

import {
  scoreRespiratoryRate,
  scoreSpO2Scale1,
  scoreSpO2Scale2,
  scoreSupplementalO2,
  scoreSystolicBP,
  scorePulse,
  scoreConsciousness,
  scoreTemperature,
  classifyNEWS2Risk,
} from './news2Rules';

import { NEWS2_RISK } from './news2Types';

const REQUIRED_INPUTS = [
  'respiratoryRate',
  'spO2',
  'systolicBP',
  'pulse',
  'consciousness',
  'temperature',
];

/**
 * Compute a full NEWS2 assessment.
 *
 * @param {import('./news2Types').NEWS2Input} input
 * @param {boolean} [useScale2=false] - Set true for hypercapnic respiratory failure patients
 * @returns {import('./news2Types').NEWS2Result}
 */
export function calculateNEWS2(input, useScale2 = false) {
  const {
    respiratoryRate = null,
    spO2 = null,
    onSupplementalO2 = false,
    systolicBP = null,
    pulse = null,
    consciousness = null,
    temperature = null,
  } = input || {};

  // ── Identify missing inputs ─────────────────────────────────────────────
  const missingInputs = [];
  if (respiratoryRate === null || isNaN(respiratoryRate)) missingInputs.push('Respiratory Rate');
  if (spO2 === null || isNaN(spO2)) missingInputs.push('SpO2');
  if (systolicBP === null || isNaN(systolicBP)) missingInputs.push('Systolic Blood Pressure');
  if (pulse === null || isNaN(pulse)) missingInputs.push('Pulse');
  if (!consciousness) missingInputs.push('Consciousness (AVPU)');
  if (temperature === null || isNaN(temperature)) missingInputs.push('Temperature');
  const isComplete = missingInputs.length === 0;

  // ── Score each component ────────────────────────────────────────────────
  const rrScore = scoreRespiratoryRate(respiratoryRate);
  const spO2Score = useScale2
    ? scoreSpO2Scale2(spO2, onSupplementalO2)
    : scoreSpO2Scale1(spO2);
  const o2Score = scoreSupplementalO2(onSupplementalO2);
  const sbpScore = scoreSystolicBP(systolicBP);
  const pulseScore = scorePulse(pulse);
  const consciousnessScore = scoreConsciousness(consciousness);
  const tempScore = scoreTemperature(temperature);

  const componentScores = {
    respiratoryRate: rrScore,
    oxygenSaturation: spO2Score,
    supplementalO2: o2Score,
    systolicBloodPressure: sbpScore,
    pulse: pulseScore,
    consciousness: consciousnessScore,
    temperature: tempScore,
  };

  // ── Check for any individual score of 3 (triggers Low-Medium alert) ─────
  const hasAny3 = Object.values(componentScores).some(s => s === 3);

  // ── Compute total ───────────────────────────────────────────────────────
  const validScores = Object.values(componentScores).filter(s => s !== null);
  const hasEnoughData = validScores.length >= 4; // at least 4 out of 7 components

  let totalScore = null;
  let riskResult;

  if (hasEnoughData) {
    totalScore = validScores.reduce((sum, s) => sum + s, 0);
    riskResult = classifyNEWS2Risk(totalScore, hasAny3);
  } else {
    riskResult = {
      riskCategory: 'Unable to assess — insufficient data',
      escalationFlag: false,
    };
  }

  return {
    score: totalScore,
    componentScores,
    oxygenSupport: onSupplementalO2,
    riskCategory: riskResult.riskCategory,
    escalationFlag: riskResult.escalationFlag,
    missingInputs,
    isComplete,
    useScale2,
    disclaimer:
      'NEWS2 is a risk-stratification score. It does not diagnose a condition. ' +
      'Clinical judgment is required in all cases.',
  };
}

/**
 * Convenience: parse string vitals from the app form into NEWS2 numeric inputs.
 * The app stores vitals as strings. This normalises them.
 *
 * @param {object} vitals - { respiratoryRate, spO2, bloodPressure, heartRate, temperature }
 * @param {string} consciousness - AVPU value
 * @param {boolean} onSupplementalO2
 * @returns {import('./news2Types').NEWS2Input}
 */
export function parseVitalsForNEWS2(vitals = {}, consciousness = null, onSupplementalO2 = false) {
  const parseNum = (val) => {
    const n = parseFloat(val);
    return isNaN(n) ? null : n;
  };

  // Extract systolic from "120/80" format
  let systolicBP = null;
  if (vitals.bloodPressure) {
    const match = String(vitals.bloodPressure).match(/^(\d+)/);
    if (match) systolicBP = parseInt(match[1], 10);
  }

  return {
    respiratoryRate: parseNum(vitals.respiratoryRate),
    spO2: parseNum(vitals.spO2),
    onSupplementalO2: Boolean(onSupplementalO2),
    systolicBP,
    pulse: parseNum(vitals.heartRate),
    consciousness: consciousness || null,
    temperature: parseNum(vitals.temperature),
  };
}
