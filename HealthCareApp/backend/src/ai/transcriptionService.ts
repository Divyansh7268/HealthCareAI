import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import * as dotenv from 'dotenv';

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.warn('[WARNING] GEMINI_API_KEY is not set in environment variables');
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || '');

// Using gemini-3.5-flash as it natively supports multimodal audio
const model = genAI.getGenerativeModel({
  model: 'gemini-3.5-flash',
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
You are an expert medical transcriptionist assisting rural healthcare workers in India.
You will be provided with an audio recording of a health worker describing a patient's condition. The recording may be in Hindi, English, or a mix of both.

YOUR TASKS:
1. Provide a highly accurate transcription of the audio.
2. Determine the primary language spoken.
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

  // Gemini supports audio/mp4, audio/mpeg, audio/wav, audio/webm, audio/flac, audio/aac, audio/ogg
  // Normalize m4a variants to audio/mp4 which Gemini properly understands
  let normalizedMimeType = mimeType;
  if (mimeType === 'audio/m4a' || mimeType === 'audio/x-m4a') {
    normalizedMimeType = 'audio/mp4';
  }

  console.log(`[TranscriptionService] Transcribing audio. originalMime=${mimeType}, normalizedMime=${normalizedMimeType}, bufferSize=${audioBuffer.length}`);

  const audioPart = {
    inlineData: {
      data: audioBuffer.toString('base64'),
      mimeType: normalizedMimeType
    }
  };

  const response = await model.generateContent([
    TRANSCRIPTION_PROMPT,
    audioPart
  ]);

  const responseText = response.response.text();
  const result = JSON.parse(responseText) as TranscriptionResult;
  
  console.log(`[TranscriptionService] Transcription complete. Language: ${result.language}. Text length: ${result.text.length}`);
  return result;
}
