/**
 * Red Flag Rules
 * Predefined critical symptom keywords that trigger immediate urgent review.
 * 
 * Source: Derived from standard emergency triage systems (e.g. Manchester Triage System)
 */

'use strict';

// Array of keywords/phrases indicating medical emergencies
const EMERGENCY_KEYWORDS = [
  'chest pain',
  'difficulty breathing',
  'shortness of breath',
  'unconscious',
  'not breathing',
  'severe bleeding',
  'coughing blood',
  'sudden weakness',
  'sudden numbness',
  'slurred speech',
  'seizure',
  'convulsion',
  'suicidal',
  'blue lips'
];

export function checkRedFlags(symptomsString = '', additionalNotes = '') {
  const text = `${symptomsString} ${additionalNotes}`.toLowerCase();
  const flags = [];

  for (const keyword of EMERGENCY_KEYWORDS) {
    if (text.includes(keyword)) {
      flags.push(`Critical symptom detected: "${keyword}"`);
    }
  }

  return flags;
}
