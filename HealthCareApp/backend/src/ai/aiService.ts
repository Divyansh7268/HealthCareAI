import { AnalyzeVisitBody } from '../validators/visitValidator';
import { RuleEngineOutput } from '../rules/ruleEngine';
import { aiAssessmentSchema, AIAssessmentResult } from './aiSchema';
import { SYSTEM_INSTRUCTION, buildClinicalPrompt } from './clinicalPrompt';
import { generateClinicalAssessment } from './geminiProvider';

export async function processClinicalAI(
  visitData: AnalyzeVisitBody,
  ruleEngineResult: RuleEngineOutput,
  patientHistory: string,
  imageParts: any[] = []
): Promise<{ assessment: AIAssessmentResult, rawResponse: string }> {
  
  // 1. Prepare Prompt
  const prompt = buildClinicalPrompt(visitData, ruleEngineResult, patientHistory);
  
  const promptParts = [prompt, ...imageParts];

  // 2. Call Gemini Provider
  const rawResponse = await generateClinicalAssessment(SYSTEM_INSTRUCTION, promptParts);

  // 3. Parse and Validate JSON output
  let parsedJson: any;
  try {
    parsedJson = JSON.parse(rawResponse);
  } catch (parseError) {
    console.error('[AIService] Failed to parse JSON response from Gemini:', rawResponse);
    throw new Error('AI Provider returned malformed JSON');
  }

  const validationResult = aiAssessmentSchema.safeParse(parsedJson);

  if (!validationResult.success) {
    console.error('[AIService] AI response violated schema:', validationResult.error.flatten());
    throw new Error('AI Provider returned output that violates safety schema');
  }

  const validatedAssessment = validationResult.data;

  // 4. Smart Doctor Routing Logic
  // Only require a doctor's review if the situation is critical/high risk OR if the rule engine triggered an emergency.
  // Note: if there is missingInformation, we want the health worker to fill it first, but if it's already an emergency, send it anyway.
  const isHighRisk = ['high', 'emergency'].includes(validatedAssessment.riskLevel);
  const isRuleEngineEmergency = ruleEngineResult.critical;
  
  if (isHighRisk || isRuleEngineEmergency) {
    validatedAssessment.doctorReviewRequired = true;
  } else {
    // For low/moderate risk cases, we do NOT strictly require a doctor's review.
    // The health worker can just follow the 'recommendedNextStep'.
    validatedAssessment.doctorReviewRequired = false;
  }

  return {
    assessment: validatedAssessment,
    rawResponse: rawResponse
  };
}
