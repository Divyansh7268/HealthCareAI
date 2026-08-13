/**
 * Main Rule Engine Orchestrator
 * 
 * Aggregates validation, vitals, and red flag rules.
 * Does NOT diagnose diseases.
 */
import { checkMissingData } from './validationRules';
import { evaluateVitals, RuleFlag } from './vitalRules';
import { evaluateRedFlags } from './redFlagRules';

export interface RuleEngineOutput {
  critical: boolean;
  riskFlags: string[]; // Descriptions of urgent/emergency issues
  missingCriticalData: string[];
  ruleTriggered: RuleFlag[]; // Full objects
}

export function runDeterministicRules(patientData: any): RuleEngineOutput {
  const missingData = checkMissingData(patientData);
  const vitalFlags = evaluateVitals(patientData.vitals);
  const redFlags = evaluateRedFlags(patientData);

  const allFlags = [...vitalFlags, ...redFlags];
  
  const hasEmergency = allFlags.some(f => f.level === 'emergency');
  const riskFlagDescriptions = allFlags.map(f => `[${f.level.toUpperCase()}] ${f.description}`);

  return {
    critical: hasEmergency,
    riskFlags: riskFlagDescriptions,
    missingCriticalData: missingData,
    ruleTriggered: allFlags
  };
}
