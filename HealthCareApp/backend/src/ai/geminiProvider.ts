import { GoogleGenerativeAI } from '@google/generative-ai';
import { geminiResponseSchema } from './aiSchema';
import * as dotenv from 'dotenv';

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.warn('[GeminiProvider] Missing GEMINI_API_KEY environment variable.');
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || '');

export async function generateClinicalAssessment(
  systemInstruction: string,
  promptParts: any[]
): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key is not configured');
  }

  // Using gemini-3.5-flash for complex clinical reasoning tasks
  const model = genAI.getGenerativeModel({
    model: 'gemini-3.5-flash',
    systemInstruction: systemInstruction,
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: geminiResponseSchema,
      temperature: 0.1, // Low temperature for deterministic, conservative responses
    },
  });

  try {
    const result = await model.generateContent(promptParts);
    return result.response.text();
  } catch (error: any) {
    console.error('[GeminiProvider] API Call Failed:', error.message);
    throw new Error(`AI Provider Error: ${error.message}`);
  }
}
