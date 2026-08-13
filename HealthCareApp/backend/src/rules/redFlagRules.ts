/**
 * Red Flag Rules
 * 
 * Checks unstructured text (symptoms, history, transcripts) for explicitly 
 * defined red-flag strings indicating potential emergencies.
 */
import { RuleFlag } from './vitalRules';

const EMERGENCY_KEYWORDS = [
  'unconscious',
  'not breathing',
  'seizure',
  'fits',
  'chest pain',
  'heart attack',
  'stroke',
  'paralyzed',
  'cannot breathe'
];

const URGENT_KEYWORDS = [
  'severe bleeding',
  'broken bone',
  'head injury',
  'confusion',
  'fainted'
];

export function evaluateRedFlags(patientData: any): RuleFlag[] {
  const flags: RuleFlag[] = [];
  
  // Aggregate all text sources
  const textSources: string[] = [];
  
  if (Array.isArray(patientData.symptoms)) {
    textSources.push(...patientData.symptoms);
  }
  if (patientData.history) {
    textSources.push(patientData.history);
  }
  if (patientData.transcript) {
    textSources.push(patientData.transcript);
  }

  const fullText = textSources.join(' ').toLowerCase();

  for (const keyword of EMERGENCY_KEYWORDS) {
    if (fullText.includes(keyword)) {
      flags.push({
        id: `RF_EMERGENCY_${keyword.toUpperCase().replace(/\s+/g, '_')}`,
        description: `Critical keyword detected: "${keyword}"`,
        level: 'emergency'
      });
    }
  }

  for (const keyword of URGENT_KEYWORDS) {
    if (fullText.includes(keyword)) {
      flags.push({
        id: `RF_URGENT_${keyword.toUpperCase().replace(/\s+/g, '_')}`,
        description: `Urgent keyword detected: "${keyword}"`,
        level: 'urgent'
      });
    }
  }

  return flags;
}
