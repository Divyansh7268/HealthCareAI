/**
 * NEWS2 Scoring Rules
 *
 * Reference:
 *   Royal College of Physicians. National Early Warning Score (NEWS) 2.
 *   London: RCP, 2017.
 *
 * These thresholds are taken DIRECTLY from Table 1 of the NEWS2 document.
 * DO NOT modify thresholds without updating the reference citation.
 */

'use strict';

import { AVPU } from './news2Types';

// ─── Respiratory Rate (breaths/min) ────────────────────────────────────────
// Source: RCP NEWS2 Table 1, Row 1
export function scoreRespiratoryRate(rr) {
  if (rr === null || rr === undefined || isNaN(rr)) return null;
  if (rr <= 8)  return 3;
  if (rr <= 11) return 1;
  if (rr <= 20) return 0;
  if (rr <= 24) return 2;
  return 3; // >= 25
}

// ─── SpO2 Scale 1 (no supplemental O2 / not hypercapnic) ─────────────────
// Source: RCP NEWS2 Table 1, Row 2 (SpO2 Scale 1)
// Use this scale for most patients.
export function scoreSpO2Scale1(spO2) {
  if (spO2 === null || spO2 === undefined || isNaN(spO2)) return null;
  if (spO2 <= 91) return 3;
  if (spO2 <= 93) return 2;
  if (spO2 <= 95) return 1;
  return 0; // >= 96
}

// ─── SpO2 Scale 2 (target 88-92% — hypercapnic respiratory failure) ──────
// Source: RCP NEWS2 Table 1, Row 2 (SpO2 Scale 2)
// This scale is ONLY for patients with known hypercapnic respiratory failure
// and a prescribed target saturation range of 88–92%.
export function scoreSpO2Scale2(spO2, onSupplementalO2) {
  if (spO2 === null || spO2 === undefined || isNaN(spO2)) return null;
  if (spO2 <= 83) return 3;
  if (spO2 <= 85) return 2;
  if (spO2 <= 87) return 1;
  if (spO2 <= 92) return 0; // 88–92 is target range
  if (spO2 <= 94) return onSupplementalO2 ? 1 : 0;
  if (spO2 <= 96) return onSupplementalO2 ? 2 : 0;
  return onSupplementalO2 ? 3 : 0;
}

// ─── Supplemental O2 ──────────────────────────────────────────────────────
// Source: RCP NEWS2 Table 1, Row 3
export function scoreSupplementalO2(onO2) {
  return onO2 ? 2 : 0;
}

// ─── Systolic Blood Pressure (mmHg) ──────────────────────────────────────
// Source: RCP NEWS2 Table 1, Row 4
export function scoreSystolicBP(sbp) {
  if (sbp === null || sbp === undefined || isNaN(sbp)) return null;
  if (sbp <= 90)  return 3;
  if (sbp <= 100) return 2;
  if (sbp <= 110) return 1;
  if (sbp <= 219) return 0;
  return 3; // >= 220
}

// ─── Pulse (bpm) ──────────────────────────────────────────────────────────
// Source: RCP NEWS2 Table 1, Row 5
export function scorePulse(pulse) {
  if (pulse === null || pulse === undefined || isNaN(pulse)) return null;
  if (pulse <= 40)  return 3;
  if (pulse <= 50)  return 1;
  if (pulse <= 90)  return 0;
  if (pulse <= 110) return 1;
  if (pulse <= 130) return 2;
  return 3; // >= 131
}

// ─── Consciousness (AVPU) ─────────────────────────────────────────────────
// Source: RCP NEWS2 Table 1, Row 6
// Any new confusion (AVPU = C) scores 3 in NEWS2.
export function scoreConsciousness(avpu) {
  if (!avpu) return null;
  if (avpu === AVPU.ALERT) return 0;
  // Confused, Voice, Pain, Unresponsive all score 3
  if ([AVPU.CONFUSED, AVPU.VOICE, AVPU.PAIN, AVPU.UNRESPONSIVE].includes(avpu)) return 3;
  return null; // unknown value
}

// ─── Temperature (°C) ────────────────────────────────────────────────────
// Source: RCP NEWS2 Table 1, Row 7
export function scoreTemperature(temp) {
  if (temp === null || temp === undefined || isNaN(temp)) return null;
  if (temp <= 35.0) return 3;
  if (temp <= 36.0) return 1;
  if (temp <= 38.0) return 0;
  if (temp <= 39.0) return 1;
  return 2; // >= 39.1
}

// ─── Risk Classification ──────────────────────────────────────────────────
// Source: RCP NEWS2 Table 2 — Clinical response to NEWS2 triggers
export function classifyNEWS2Risk(totalScore, hasAny3) {
  if (hasAny3) {
    // Any single parameter scoring 3 triggers Low-Medium risk response
    return { riskCategory: 'Low-Medium', escalationFlag: true };
  }
  if (totalScore === 0) return { riskCategory: 'Low', escalationFlag: false };
  if (totalScore <= 4) return { riskCategory: 'Low', escalationFlag: false };
  if (totalScore === 5 || totalScore === 6) {
    return { riskCategory: 'Medium', escalationFlag: true };
  }
  // Score >= 7
  return { riskCategory: 'High', escalationFlag: true };
}
