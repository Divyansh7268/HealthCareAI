/**
 * GCS Calculator Tests
 */
'use strict';

import { calculateGCS } from './gcsCalculator';

describe('GCS Calculator — Teasdale & Jennett 1974', () => {

  test('Normal patient (E4 V5 M6) scores 15', () => {
    const result = calculateGCS({ eye: 4, verbal: 5, motor: 6 });
    expect(result.total).toBe(15);
    expect(result.isComplete).toBe(true);
    expect(result.interpretation).toBe('Normal');
  });

  test('Severe impairment (E1 V1 M1) scores 3', () => {
    const result = calculateGCS({ eye: 1, verbal: 1, motor: 1 });
    expect(result.total).toBe(3);
    expect(result.interpretation).toContain('Severe impairment');
  });

  test('Moderate impairment (E3 V4 M4) scores 11', () => {
    const result = calculateGCS({ eye: 3, verbal: 4, motor: 4 });
    expect(result.total).toBe(11);
    expect(result.interpretation).toContain('Moderate impairment');
  });

  test('Missing component returns null total', () => {
    const result = calculateGCS({ eye: 4, motor: 6 }); // missing verbal
    expect(result.total).toBeNull();
    expect(result.isComplete).toBe(false);
    expect(result.missingComponents).toContain('Verbal Response');
  });

  test('Out of range values produce errors and null total', () => {
    const result = calculateGCS({ eye: 5, verbal: 5, motor: 6 }); // eye max is 4
    expect(result.total).toBeNull();
    expect(result.isComplete).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
  
});
