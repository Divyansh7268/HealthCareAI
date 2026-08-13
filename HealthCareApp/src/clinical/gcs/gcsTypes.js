/**
 * GCS Types
 *
 * Reference:
 *   Teasdale G, Jennett B. Assessment of coma and impaired consciousness.
 *   A practical scale. Lancet. 1974 Jul 13;2(7872):81-4.
 *
 *   Updated scale documentation:
 *   Teasdale G, et al. The Glasgow Coma Scale at 40 years: standing the test of time.
 *   Lancet Neurology. 2014;13(8):844-854. doi:10.1016/S1474-4422(14)70120-6
 *
 *   Extended GCS (including Pupil Reactivity — GCS-P) is NOT implemented here.
 *   The standard 3-component GCS is used as documented above.
 */

'use strict';

/**
 * Eye Opening Response — GCS E (1–4)
 * Source: Teasdale & Jennett 1974, Table I
 */
export const GCS_EYE = Object.freeze({
  SPONTANEOUS:   { value: 4, label: 'Spontaneous' },
  TO_VOICE:      { value: 3, label: 'To voice' },
  TO_PAIN:       { value: 2, label: 'To pain' },
  NONE:          { value: 1, label: 'No response' },
});

/**
 * Verbal Response — GCS V (1–5)
 * Source: Teasdale & Jennett 1974, Table I
 */
export const GCS_VERBAL = Object.freeze({
  ORIENTATED:   { value: 5, label: 'Orientated' },
  CONFUSED:     { value: 4, label: 'Confused' },
  WORDS:        { value: 3, label: 'Inappropriate words' },
  SOUNDS:       { value: 2, label: 'Incomprehensible sounds' },
  NONE:         { value: 1, label: 'No response' },
});

/**
 * Motor Response — GCS M (1–6)
 * Source: Teasdale & Jennett 1974, Table I
 * Updated labels: Teasdale et al. 2014
 */
export const GCS_MOTOR = Object.freeze({
  OBEYS:            { value: 6, label: 'Obeys commands' },
  LOCALISES:        { value: 5, label: 'Localises to pain' },
  WITHDRAWS:        { value: 4, label: 'Withdrawal from pain' },
  FLEXION:          { value: 3, label: 'Abnormal flexion' },
  EXTENSION:        { value: 2, label: 'Extension to pain' },
  NONE:             { value: 1, label: 'No motor response' },
});

/**
 * GCS Severity Categories
 * Source: Common clinical usage based on original GCS scale.
 *
 * IMPORTANT: These severity categories are widely cited clinical conventions.
 * They are NOT diagnostic criteria.
 * Reference: NICE Clinical Knowledge Summary; WHO Emergency Triage, Assessment and Treatment.
 */
export const GCS_SEVERITY = Object.freeze({
  SEVERE:   { range: [3, 8],   label: 'Severe impairment' },
  MODERATE: { range: [9, 12],  label: 'Moderate impairment' },
  MILD:     { range: [13, 15], label: 'Mild or no impairment' },
});

/**
 * @typedef {object} GCSInput
 * @property {number|null} eye    - 1 to 4
 * @property {number|null} verbal - 1 to 5
 * @property {number|null} motor  - 1 to 6
 */

/**
 * @typedef {object} GCSResult
 * @property {number|null} eye
 * @property {number|null} verbal
 * @property {number|null} motor
 * @property {number|null} total       - null if any component is missing
 * @property {string}      interpretation
 * @property {boolean}     isComplete
 * @property {string[]}    missingComponents
 * @property {string}      disclaimer
 */
