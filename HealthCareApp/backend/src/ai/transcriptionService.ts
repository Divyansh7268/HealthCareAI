import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import * as dotenv from 'dotenv';

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const SARVAM_API_KEY = process.env.SARVAM_API_KEY;

if (!GEMINI_API_KEY) {
  console.warn('[WARNING] GEMINI_API_KEY is not set in environment variables');
}
if (!SARVAM_API_KEY) {
  console.warn('[WARNING] SARVAM_API_KEY is not set in environment variables');
}

import FormData from 'form-data';
import axios from 'axios';

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || '');

// Using gemini-1.5-flash as it natively supports multimodal audio
const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash',
  generationConfig: {
    responseMimeType: 'application/json',
    responseSchema: {
      type: SchemaType.OBJECT,
      properties: {
        text: {
          type: SchemaType.STRING,
          description: "The complete, accurate transcription of the audio, preserving the original language (Hindi/English) meaning."
        },
        language: {
          type: SchemaType.STRING,
          description: "The primary language of the audio (e.g., 'Hindi', 'English', 'Mixed Hindi-English')."
        },
        extractedSymptoms: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.STRING
          },
          description: "A list of potential medical symptoms mentioned in the audio. Preserve uncertainty (e.g. 'Possible fever'). Do not invent symptoms."
        }
      },
      required: ['text', 'language', 'extractedSymptoms']
    }
  }
});

const TRANSCRIPTION_PROMPT = `
You are an expert medical assistant assisting rural healthcare workers in India.
You will be provided with a transcript of a health worker describing a patient's condition. The text may be in Hindi, English, or a mix of both.

YOUR TASKS:
1. Return the exact transcription text provided to you.
2. Determine the primary language spoken in the text.
3. Extract a list of potential symptoms mentioned.

CRITICAL RULES:
- Preserve the exact meaning of the speech.
- Do NOT convert uncertain speech into definite medical facts (e.g., if they say "maybe fever", extract "possible fever").
- Do NOT invent or infer symptoms that were not explicitly mentioned.
- Maintain a professional, clinical tone in the extracted symptoms.
`;

export interface TranscriptionResult {
  text: string;
  language: string;
  extractedSymptoms: string[];
}

export async function transcribeAudio(audioBuffer: Buffer, mimeType: string): Promise<TranscriptionResult> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is missing');
  }
  if (!SARVAM_API_KEY) {
    throw new Error('SARVAM_API_KEY is missing');
  }

  // Normalize m4a variants to audio/mp4
  let normalizedMimeType = mimeType;
  if (mimeType === 'audio/m4a' || mimeType === 'audio/x-m4a') {
    normalizedMimeType = 'audio/mp4';
  }

  console.log(`[TranscriptionService] Transcribing audio with Sarvam. originalMime=${mimeType}, normalizedMime=${normalizedMimeType}, bufferSize=${audioBuffer.length}`);

  // 1. Call Sarvam AI for Speech-to-Text
  const formData = new FormData();
  formData.append('file', audioBuffer, {
    filename: 'audio.mp4',
    contentType: normalizedMimeType,
  });
  
  // You can specify model or language_code if needed. Leaving defaults for Saaras.
  
  let transcriptText = "";
  try {
    const sarvamRes = await axios.post('https://api.sarvam.ai/speech-to-text', formData, {
      headers: {
        'api-subscription-key': SARVAM_API_KEY,
        ...formData.getHeaders(),
      },
    });
    transcriptText = sarvamRes.data.transcript;
    console.log(`[TranscriptionService] Sarvam STT complete. Text: ${transcriptText}`);
  } catch (err: any) {
    console.error('[TranscriptionService] Sarvam API Error:', err.response?.data || err.message);
    throw new Error('Failed to transcribe audio with Sarvam AI');
  }

  // 2. Call Gemini to extract symptoms from the transcript
  console.log(`[TranscriptionService] Extracting symptoms with Gemini...`);
  const response = await model.generateContent([
    TRANSCRIPTION_PROMPT,
    `Here is the transcript: "${transcriptText}"`
  ]);

  const responseText = response.response.text();
  const result = JSON.parse(responseText) as TranscriptionResult;
  
  // Ensure the transcript from Sarvam is exactly what we return
  result.text = transcriptText;
  
  console.log(`[TranscriptionService] Analysis complete. Language: ${result.language}. Symptoms: ${result.extractedSymptoms.join(', ')}`);
  return result;
}
