/**
 * NEWS2 Types
 *
 * Reference:
 *   Royal College of Physicians. National Early Warning Score (NEWS) 2:
 *   Standardising the assessment of acute-illness severity in the NHS.
 *   Updated report of a working party. London: RCP, 2017.
 *   https://www.rcplondon.ac.uk/projects/outputs/national-early-warning-score-news-2
 */

'use strict';

/**
 * AVPU Consciousness Scale values.
 * A = Alert
 * C = Confused (new addition in NEWS2)
 * V = Responds to Voice
 * P = Responds to Pain
 * U = Unresponsive
 */
export const AVPU = Object.freeze({
  ALERT: 'A',
  CONFUSED: 'C',
  VOICE: 'V',
  PAIN: 'P',
  UNRESPONSIVE: 'U',
});

/**
 * NEWS2 Risk Categories as defined by RCP 2017.
 */
export const NEWS2_RISK = Object.freeze({
  LOW: 'Low',
  LOW_MEDIUM: 'Low-Medium',
  MEDIUM: 'Medium',
  HIGH: 'High',
});

/**
 * @typedef {object} NEWS2Input
 * @property {number|null} respiratoryRate     - breaths per minute
 * @property {number|null} spO2                - oxygen saturation %
 * @property {boolean}     onSupplementalO2    - patient on supplemental oxygen?
 * @property {number|null} systolicBP          - systolic blood pressure mmHg
 * @property {number|null} pulse               - pulse rate bpm
 * @property {string|null} consciousness       - one of AVPU values
 * @property {number|null} temperature         - temperature °C
 */

/**
 * @typedef {object} NEWS2ComponentScores
 * @property {number|null} respiratoryRate
 * @property {number|null} oxygenSaturation
 * @property {number|null} systolicBloodPressure
 * @property {number|null} pulse
 * @property {number|null} consciousness
 * @property {number|null} temperature
 */

/**
 * @typedef {object} NEWS2Result
 * @property {number|null} score              - Total NEWS2 score (null if insufficient data)
 * @property {NEWS2ComponentScores} componentScores
 * @property {boolean} oxygenSupport          - Whether supplemental O2 was in use
 * @property {string} riskCategory            - NEWS2_RISK value
 * @property {boolean} escalationFlag         - true if urgent/immediate escalation needed
 * @property {string[]} missingInputs         - List of missing required inputs
 * @property {boolean} isComplete             - false if any required input is missing
 */
