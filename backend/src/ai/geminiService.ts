/**
 * Gemini AI Service
 * 
 * IMPORTANT: The Gemini API key lives ONLY on the backend server.
 * It is NEVER exposed to the React Native app.
 * 
 * This service:
 *   1. Builds a structured clinical prompt from patient data + rule engine output.
 *   2. Calls Gemini with the prompt.
 *   3. Parses and validates the JSON response.
 *   4. Returns a strongly-typed AIAssessmentResult.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { aiResponseSchema, AIAssessmentResult } from '../validators/visitValidator';
import { RuleEngineResult } from './ruleEngine';
import { AnalyzeVisitBody } from '../validators/visitValidator';
import * as dotenv from 'dotenv';

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// ─────────────────────────────────────────────────────────────
// System Prompt (defines Gemini's role)
// ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are a medical AI assistant supporting rural healthcare workers in India.
Your role is to analyze patient symptom data and assist with preliminary clinical assessment.

IMPORTANT RULES:
- You MUST respond ONLY with a valid JSON object matching the schema described below.
- Do NOT add any explanatory text before or after the JSON.
- Do NOT make a definitive diagnosis. Use clinical assessment language.
- Always add a disclaimer that this is AI-assisted and not a substitute for clinical judgment.
- Be conservative — when in doubt, recommend referral to a doctor.
- Consider common diseases prevalent in rural India (malaria, typhoid, TB, dengue, etc.).

REQUIRED JSON SCHEMA:
{
  "riskLevel": "low" | "moderate" | "high" | "critical",
  "possibleConditions": [
    {
      "name": "string",
      "likelihood": "possible" | "probable" | "likely",
      "notes": "string (optional)"
    }
  ],
  "recommendedActions": ["string", ...],
  "urgency": "routine" | "urgent" | "emergency",
  "treatmentSuggestions": ["string", ...],
  "referralRequired": true | false,
  "referralReason": "string (if referralRequired)",
  "followUpAdvice": "string",
  "confidenceScore": 0.0 to 1.0,
  "disclaimer": "string"
}`;

// ─────────────────────────────────────────────────────────────
// Gemini Analysis Function
// ─────────────────────────────────────────────────────────────
export async function analyzeWithGemini(
  visitData: AnalyzeVisitBody,
  ruleEngineResult: RuleEngineResult,
  patientHistory: string
): Promise<AIAssessmentResult> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured in backend/.env');
  }

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  // Build prompt from clinical summary
  const userPrompt = `
PATIENT CLINICAL DATA:
${ruleEngineResult.clinicalSummary}

PREVIOUS PATIENT HISTORY:
${patientHistory || 'No previous visit history available.'}

RULE ENGINE PRE-ASSESSMENT:
- Risk hint from vitals: ${ruleEngineResult.overallRiskHint.toUpperCase()}
- Flags detected: ${ruleEngineResult.flags.length > 0 ? ruleEngineResult.flags.map(f => f.label).join(', ') : 'None'}

Voice transcript from health worker: "${visitData.voiceTranscript || 'Not available'}"

Please provide a structured clinical assessment as JSON.`;

  const fullPrompt = `${SYSTEM_PROMPT}\n\n${userPrompt}`;

  let rawText = '';
  try {
    const result = await model.generateContent(fullPrompt);
    rawText = result.response.text();
  } catch (geminiError: any) {
    console.error('[Gemini] API call failed:', geminiError?.message);
    throw new Error(`Gemini API error: ${geminiError?.message}`);
  }

  // Parse JSON from Gemini response (handle markdown code fences)
  const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/) || rawText.match(/(\{[\s\S]*\})/);
  const jsonString = jsonMatch?.[1] || rawText.trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    console.error('[Gemini] Failed to parse response as JSON:', rawText.substring(0, 500));
    throw new Error('Gemini returned non-JSON response. Cannot process AI assessment.');
  }

  // Validate the parsed object against our expected schema
  const validated = aiResponseSchema.safeParse(parsed);
  if (!validated.success) {
    console.error('[Gemini] Response failed schema validation:', validated.error.flatten());
    throw new Error(`Gemini response did not match expected schema: ${JSON.stringify(validated.error.flatten().fieldErrors)}`);
  }

  return validated.data;
}
