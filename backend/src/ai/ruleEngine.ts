/**
 * Rule Engine
 * 
 * Evaluates patient vitals and body locations BEFORE sending to Gemini.
 * Purpose:
 *   1. Detect immediately critical conditions (e.g. SpO2 < 90%) that need
 *      urgent flagging regardless of AI output.
 *   2. Enrich the prompt with structured clinical context.
 *   3. Allow the system to operate partially even if Gemini is unavailable.
 */

import { AnalyzeVisitBody } from '../validators/visitValidator';

export interface RuleEngineResult {
  flags: ClinicalFlag[];
  overallRiskHint: 'low' | 'moderate' | 'high' | 'critical';
  clinicalSummary: string;
}

export interface ClinicalFlag {
  code: string;
  label: string;
  severity: 'warning' | 'critical';
  value?: string;
}

export function runRuleEngine(visitData: AnalyzeVisitBody): RuleEngineResult {
  const flags: ClinicalFlag[] = [];
  const vitals = visitData.vitals || {};

  // ── Vital Sign Rules ────────────────────────────────────────

  // SpO2
  const spO2 = parseFloat(vitals.spO2 || '');
  if (!isNaN(spO2)) {
    if (spO2 < 90) flags.push({ code: 'SPO2_CRITICAL', label: 'Critical low SpO2 (<90%)', severity: 'critical', value: `${spO2}%` });
    else if (spO2 < 94) flags.push({ code: 'SPO2_LOW', label: 'Low SpO2 (<94%)', severity: 'warning', value: `${spO2}%` });
  }

  // Temperature
  const temp = parseFloat(vitals.temperature || '');
  if (!isNaN(temp)) {
    if (temp >= 104) flags.push({ code: 'HYPERPYREXIA', label: 'Hyperpyrexia (≥104°F / ≥40°C)', severity: 'critical', value: `${temp}` });
    else if (temp >= 100.4) flags.push({ code: 'FEVER', label: 'Fever (≥100.4°F)', severity: 'warning', value: `${temp}` });
    else if (temp < 96) flags.push({ code: 'HYPOTHERMIA', label: 'Hypothermia (<96°F)', severity: 'critical', value: `${temp}` });
  }

  // Heart Rate
  const hr = parseFloat(vitals.heartRate || '');
  if (!isNaN(hr)) {
    if (hr > 150) flags.push({ code: 'TACHYCARDIA_SEVERE', label: 'Severe Tachycardia (>150 bpm)', severity: 'critical', value: `${hr} bpm` });
    else if (hr > 100) flags.push({ code: 'TACHYCARDIA', label: 'Tachycardia (>100 bpm)', severity: 'warning', value: `${hr} bpm` });
    else if (hr < 50) flags.push({ code: 'BRADYCARDIA', label: 'Bradycardia (<50 bpm)', severity: 'warning', value: `${hr} bpm` });
  }

  // Respiratory Rate
  const rr = parseFloat(vitals.respiratoryRate || '');
  if (!isNaN(rr)) {
    if (rr > 30) flags.push({ code: 'TACHYPNEA_SEVERE', label: 'Severe Tachypnea (>30 breaths/min)', severity: 'critical', value: `${rr}/min` });
    else if (rr > 20) flags.push({ code: 'TACHYPNEA', label: 'Tachypnea (>20 breaths/min)', severity: 'warning', value: `${rr}/min` });
  }

  // Blood Pressure (systolic only)
  const bpParts = (vitals.bloodPressure || '').split('/');
  const systolic = parseFloat(bpParts[0] || '');
  if (!isNaN(systolic)) {
    if (systolic >= 180) flags.push({ code: 'HYPERTENSIVE_CRISIS', label: 'Hypertensive Crisis (≥180 mmHg systolic)', severity: 'critical', value: `${systolic} mmHg` });
    else if (systolic < 90) flags.push({ code: 'HYPOTENSION', label: 'Hypotension (<90 mmHg systolic)', severity: 'critical', value: `${systolic} mmHg` });
  }

  // ── Symptom-based Rules ─────────────────────────────────────
  const symptomsLower = (visitData.symptoms || '').toLowerCase();
  if (/chest pain|chest pressure|angina/.test(symptomsLower)) {
    flags.push({ code: 'CHEST_PAIN', label: 'Chest Pain reported', severity: 'critical' });
  }
  if (/difficulty breath|breathless|shortness of breath|dyspnea/.test(symptomsLower)) {
    flags.push({ code: 'DYSPNEA', label: 'Breathing difficulty reported', severity: 'warning' });
  }
  if (/unconscious|faint|seizure|convuls/.test(symptomsLower)) {
    flags.push({ code: 'ALTERED_CONSCIOUSNESS', label: 'Altered consciousness reported', severity: 'critical' });
  }

  // ── Determine Overall Risk Hint ─────────────────────────────
  const hasCritical = flags.some(f => f.severity === 'critical');
  const hasWarning = flags.some(f => f.severity === 'warning');

  let overallRiskHint: RuleEngineResult['overallRiskHint'] = 'low';
  if (hasCritical) overallRiskHint = 'critical';
  else if (hasWarning) overallRiskHint = 'moderate';

  // ── Build Clinical Summary for AI prompt ────────────────────
  const bodyParts = (visitData.bodyLocations || [])
    .map(b => `${b.region.label} (${b.complaint || 'unspecified'}, ${b.severity || 'unspecified'} severity)`)
    .join(', ');

  const flagSummary = flags.length > 0
    ? `RULE ENGINE FLAGS: ${flags.map(f => f.label).join('; ')}.`
    : 'No immediate critical flags from rule engine.';

  const clinicalSummary = [
    `Patient Symptoms: ${visitData.symptoms || 'Not provided'}`,
    `Duration: ${visitData.duration || 'Not provided'}`,
    `Body Areas Affected: ${bodyParts || 'None specified'}`,
    `Vitals: Temp=${vitals.temperature || 'N/A'}, BP=${vitals.bloodPressure || 'N/A'}, HR=${vitals.heartRate || 'N/A'}, SpO2=${vitals.spO2 || 'N/A'}, RR=${vitals.respiratoryRate || 'N/A'}, Weight=${vitals.weight || 'N/A'}`,
    flagSummary,
    visitData.additionalNotes ? `Additional Notes: ${visitData.additionalNotes}` : '',
  ].filter(Boolean).join('\n');

  return { flags, overallRiskHint, clinicalSummary };
}
