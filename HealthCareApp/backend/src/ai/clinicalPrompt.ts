import { AnalyzeVisitBody } from '../validators/visitValidator';
import { RuleEngineOutput } from '../rules/ruleEngine';

export const SYSTEM_INSTRUCTION = `ROLE:
You are a clinical decision-support assistant used by trained health workers and reviewed by doctors.

OBJECTIVE:
Help organize and interpret provided patient information.

NOT ALLOWED:
- final autonomous diagnosis
- definitive treatment decisions
- fabricated facts
- invented confidence
- fabricated patient history
- unsupported medical claims

INPUT PRIORITY:
1. Current vital signs
2. Current symptoms
3. Red-flag findings
4. Relevant medical history
5. Previous visit trend
6. Body location
7. Image observations
8. Voice transcript
9. Other notes

For every possible condition:
Explain which provided findings support it.

For every uncertainty:
Say what information is missing.

For returning patients:
Explicitly compare relevant previous and current findings.
Identify trend components (e.g., temperature improved, oxygen saturation improved).
If today's condition is worse: explicitly highlight worsening variables.

If information conflicts:
Do NOT resolve it by guessing.
Instead: mark it uncertain and request clinician review.

The output is advisory only.`;

export function buildClinicalPrompt(
  visitData: AnalyzeVisitBody,
  ruleEngineResult: RuleEngineOutput,
  patientHistory: string
): string {
  return `
--- CURRENT PATIENT DATA ---
- Demographics: Age/Gender provided in history if available.
- Symptoms: ${visitData.symptoms || 'None reported'}
- Duration: ${visitData.duration || 'Not reported'}
- Body Locations: ${visitData.bodyLocations ? visitData.bodyLocations.map(l => `${l.region?.label} (${l.view}) - ${l.severity || 'Unknown'} ${l.complaint || 'issue'}`).join('; ') : 'None reported'}
- Vitals: ${JSON.stringify(visitData.vitals || {})}
- Voice Transcript: "${visitData.voiceTranscript || 'Not provided'}"

- Critical Emergency Detected: ${ruleEngineResult.critical ? 'YES' : 'NO'}
- Rule Flags Triggered: ${ruleEngineResult.ruleTriggered.length > 0 ? ruleEngineResult.ruleTriggered.map(f => `[${f.level.toUpperCase()}] ${f.description}`).join(' | ') : 'None'}
- Missing Critical Data: ${ruleEngineResult.missingCriticalData.length > 0 ? ruleEngineResult.missingCriticalData.join(', ') : 'None'}

--- LONGITUDINAL CLINICAL CONTEXT ---
${patientHistory || 'No previous history available.'}

Based on the above data and the strict boundaries provided, generate the structured JSON assessment.
`;
}
