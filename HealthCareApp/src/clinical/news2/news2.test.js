/**
 * NEWS2 Tests
 *
 * Tests the NEWS2 calculator against the official RCP 2017 scoring table.
 * Each test case is annotated with expected RCP values.
 */

'use strict';

import { calculateNEWS2, parseVitalsForNEWS2 } from './news2Calculator';
import { AVPU } from './news2Types';

describe('NEWS2 Calculator — RCP 2017', () => {

  // ── Normal patient — all readings in normal range ─────────────────────
  test('Normal patient scores 0 — no escalation', () => {
    const result = calculateNEWS2({
      respiratoryRate: 16, // score 0
      spO2: 97,            // score 0
      onSupplementalO2: false, // score 0
      systolicBP: 120,     // score 0
      pulse: 80,           // score 0
      consciousness: AVPU.ALERT, // score 0
      temperature: 37.0,   // score 0
    });
    expect(result.score).toBe(0);
    expect(result.riskCategory).toBe('Low');
    expect(result.escalationFlag).toBe(false);
    expect(result.isComplete).toBe(true);
  });

  // ── Respiratory Rate boundaries ───────────────────────────────────────
  test('RR ≤ 8 scores 3', () => {
    const result = calculateNEWS2({ respiratoryRate: 6, spO2: 97, onSupplementalO2: false, systolicBP: 120, pulse: 80, consciousness: AVPU.ALERT, temperature: 37.0 });
    expect(result.componentScores.respiratoryRate).toBe(3);
    expect(result.escalationFlag).toBe(true);
  });

  test('RR 9–11 scores 1', () => {
    const result = calculateNEWS2({ respiratoryRate: 10, spO2: 97, onSupplementalO2: false, systolicBP: 120, pulse: 80, consciousness: AVPU.ALERT, temperature: 37.0 });
    expect(result.componentScores.respiratoryRate).toBe(1);
  });

  test('RR 12–20 scores 0', () => {
    const result = calculateNEWS2({ respiratoryRate: 18, spO2: 97, onSupplementalO2: false, systolicBP: 120, pulse: 80, consciousness: AVPU.ALERT, temperature: 37.0 });
    expect(result.componentScores.respiratoryRate).toBe(0);
  });

  test('RR 21–24 scores 2', () => {
    const result = calculateNEWS2({ respiratoryRate: 22, spO2: 97, onSupplementalO2: false, systolicBP: 120, pulse: 80, consciousness: AVPU.ALERT, temperature: 37.0 });
    expect(result.componentScores.respiratoryRate).toBe(2);
  });

  test('RR ≥ 25 scores 3', () => {
    const result = calculateNEWS2({ respiratoryRate: 28, spO2: 97, onSupplementalO2: false, systolicBP: 120, pulse: 80, consciousness: AVPU.ALERT, temperature: 37.0 });
    expect(result.componentScores.respiratoryRate).toBe(3);
  });

  // ── SpO2 Scale 1 boundaries ───────────────────────────────────────────
  test('SpO2 ≤ 91 scores 3', () => {
    const result = calculateNEWS2({ respiratoryRate: 16, spO2: 90, onSupplementalO2: false, systolicBP: 120, pulse: 80, consciousness: AVPU.ALERT, temperature: 37.0 });
    expect(result.componentScores.oxygenSaturation).toBe(3);
    expect(result.escalationFlag).toBe(true);
  });

  test('SpO2 92–93 scores 2', () => {
    const result = calculateNEWS2({ respiratoryRate: 16, spO2: 92, onSupplementalO2: false, systolicBP: 120, pulse: 80, consciousness: AVPU.ALERT, temperature: 37.0 });
    expect(result.componentScores.oxygenSaturation).toBe(2);
  });

  test('SpO2 94–95 scores 1', () => {
    const result = calculateNEWS2({ respiratoryRate: 16, spO2: 95, onSupplementalO2: false, systolicBP: 120, pulse: 80, consciousness: AVPU.ALERT, temperature: 37.0 });
    expect(result.componentScores.oxygenSaturation).toBe(1);
  });

  test('SpO2 ≥ 96 scores 0', () => {
    const result = calculateNEWS2({ respiratoryRate: 16, spO2: 98, onSupplementalO2: false, systolicBP: 120, pulse: 80, consciousness: AVPU.ALERT, temperature: 37.0 });
    expect(result.componentScores.oxygenSaturation).toBe(0);
  });

  // ── Supplemental O2 ───────────────────────────────────────────────────
  test('Supplemental O2 scores 2', () => {
    const result = calculateNEWS2({ respiratoryRate: 16, spO2: 97, onSupplementalO2: true, systolicBP: 120, pulse: 80, consciousness: AVPU.ALERT, temperature: 37.0 });
    expect(result.componentScores.supplementalO2).toBe(2);
    expect(result.oxygenSupport).toBe(true);
  });

  // ── Systolic BP ───────────────────────────────────────────────────────
  test('SBP ≤ 90 scores 3', () => {
    const result = calculateNEWS2({ respiratoryRate: 16, spO2: 97, onSupplementalO2: false, systolicBP: 85, pulse: 80, consciousness: AVPU.ALERT, temperature: 37.0 });
    expect(result.componentScores.systolicBloodPressure).toBe(3);
  });

  test('SBP 111-219 scores 0', () => {
    const result = calculateNEWS2({ respiratoryRate: 16, spO2: 97, onSupplementalO2: false, systolicBP: 130, pulse: 80, consciousness: AVPU.ALERT, temperature: 37.0 });
    expect(result.componentScores.systolicBloodPressure).toBe(0);
  });

  test('SBP ≥ 220 scores 3', () => {
    const result = calculateNEWS2({ respiratoryRate: 16, spO2: 97, onSupplementalO2: false, systolicBP: 225, pulse: 80, consciousness: AVPU.ALERT, temperature: 37.0 });
    expect(result.componentScores.systolicBloodPressure).toBe(3);
  });

  // ── Consciousness ─────────────────────────────────────────────────────
  test('AVPU Alert scores 0', () => {
    const result = calculateNEWS2({ respiratoryRate: 16, spO2: 97, onSupplementalO2: false, systolicBP: 120, pulse: 80, consciousness: AVPU.ALERT, temperature: 37.0 });
    expect(result.componentScores.consciousness).toBe(0);
  });

  test('AVPU Confused scores 3', () => {
    const result = calculateNEWS2({ respiratoryRate: 16, spO2: 97, onSupplementalO2: false, systolicBP: 120, pulse: 80, consciousness: AVPU.CONFUSED, temperature: 37.0 });
    expect(result.componentScores.consciousness).toBe(3);
    expect(result.escalationFlag).toBe(true);
  });

  test('AVPU Unresponsive scores 3', () => {
    const result = calculateNEWS2({ respiratoryRate: 16, spO2: 97, onSupplementalO2: false, systolicBP: 120, pulse: 80, consciousness: AVPU.UNRESPONSIVE, temperature: 37.0 });
    expect(result.componentScores.consciousness).toBe(3);
  });

  // ── Temperature ───────────────────────────────────────────────────────
  test('Temperature ≤ 35.0 scores 3', () => {
    const result = calculateNEWS2({ respiratoryRate: 16, spO2: 97, onSupplementalO2: false, systolicBP: 120, pulse: 80, consciousness: AVPU.ALERT, temperature: 34.5 });
    expect(result.componentScores.temperature).toBe(3);
  });

  test('Temperature 36.1–38.0 scores 0', () => {
    const result = calculateNEWS2({ respiratoryRate: 16, spO2: 97, onSupplementalO2: false, systolicBP: 120, pulse: 80, consciousness: AVPU.ALERT, temperature: 37.5 });
    expect(result.componentScores.temperature).toBe(0);
  });

  test('Temperature ≥ 39.1 scores 2', () => {
    const result = calculateNEWS2({ respiratoryRate: 16, spO2: 97, onSupplementalO2: false, systolicBP: 120, pulse: 80, consciousness: AVPU.ALERT, temperature: 39.5 });
    expect(result.componentScores.temperature).toBe(2);
  });

  // ── Risk Classification ───────────────────────────────────────────────
  test('Total score 5-6 = Medium risk with escalation', () => {
    // RR=22(2) + SBP=105(2) + pulse=100(1) = 5
    const result = calculateNEWS2({ respiratoryRate: 22, spO2: 97, onSupplementalO2: false, systolicBP: 105, pulse: 100, consciousness: AVPU.ALERT, temperature: 37.0 });
    expect(result.score).toBe(5);
    expect(result.riskCategory).toBe('Medium');
    expect(result.escalationFlag).toBe(true);
  });

  test('Score >= 7 = High risk', () => {
    const result = calculateNEWS2({ respiratoryRate: 28, spO2: 90, onSupplementalO2: true, systolicBP: 85, pulse: 130, consciousness: AVPU.CONFUSED, temperature: 34.0 });
    expect(result.riskCategory).toBe('High');
    expect(result.score).toBeGreaterThanOrEqual(7);
  });

  // ── Missing data ──────────────────────────────────────────────────────
  test('Missing inputs are listed', () => {
    const result = calculateNEWS2({ respiratoryRate: 16 });
    expect(result.isComplete).toBe(false);
    expect(result.missingInputs.length).toBeGreaterThan(0);
  });

  test('Invalid (null) respiratory rate returns null component score', () => {
    const result = calculateNEWS2({ respiratoryRate: null, spO2: 97, onSupplementalO2: false, systolicBP: 120, pulse: 80, consciousness: AVPU.ALERT, temperature: 37.0 });
    expect(result.componentScores.respiratoryRate).toBeNull();
  });

  // ── Vitals parser ─────────────────────────────────────────────────────
  test('parseVitalsForNEWS2 correctly extracts systolic from BP string', () => {
    const parsed = parseVitalsForNEWS2({ bloodPressure: '128/82', heartRate: '76', spO2: '98', respiratoryRate: '16', temperature: '37.2' }, AVPU.ALERT, false);
    expect(parsed.systolicBP).toBe(128);
    expect(parsed.pulse).toBe(76);
    expect(parsed.spO2).toBe(98);
    expect(parsed.respiratoryRate).toBe(16);
    expect(parsed.temperature).toBe(37.2);
  });
});
