import { z } from 'zod';
import { SchemaType, Schema } from '@google/generative-ai';

// ─────────────────────────────────────────────────────────────────
// Zod Schema (Application side validation)
// ─────────────────────────────────────────────────────────────────
export const aiAssessmentSchema = z.object({
  assessmentStatus: z.string(),
  riskLevel: z.enum(['low', 'moderate', 'high', 'emergency', 'unable_to_assess']),
  possibleConditions: z.array(z.object({
    name: z.string(),
    reasoning: z.string(),
    supportingFindings: z.array(z.string())
  })),
  redFlags: z.array(z.string()),
  missingInformation: z.array(z.string()),
  currentSymptomsSummary: z.string(),
  trendAssessment: z.object({
    status: z.enum(['improving', 'stable', 'worsening', 'unclear', 'first_visit']),
    comparison: z.array(z.string())
  }),
  recommendedNextStep: z.string(),
  doctorReviewRequired: z.boolean(),
  limitations: z.array(z.string())
});

export type AIAssessmentResult = z.infer<typeof aiAssessmentSchema>;

// ─────────────────────────────────────────────────────────────────
// Gemini SDK Schema (Forces model to return exact JSON)
// ─────────────────────────────────────────────────────────────────
export const geminiResponseSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    assessmentStatus: { type: SchemaType.STRING, description: "Brief summary of the clinical assessment status." },
    riskLevel: { 
      type: SchemaType.STRING, 
      enum: ['low', 'moderate', 'high', 'emergency', 'unable_to_assess'],
      format: 'enum',
      description: "Triage risk level."
    },
    possibleConditions: {
      type: SchemaType.ARRAY,
      description: "Differential possibilities. Must never claim certainty.",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING, description: "Condition name." },
          reasoning: { type: SchemaType.STRING, description: "Why this is possible." },
          supportingFindings: { 
            type: SchemaType.ARRAY, 
            items: { type: SchemaType.STRING } 
          }
        },
        required: ["name", "reasoning", "supportingFindings"]
      }
    },
    redFlags: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: "Concerning findings that may require immediate attention."
    },
    missingInformation: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: "Information that is missing but necessary for a better assessment."
    },
    currentSymptomsSummary: {
      type: SchemaType.STRING,
      description: "Concise doctor-facing summary of current symptoms."
    },
    trendAssessment: {
      type: SchemaType.OBJECT,
      properties: {
        status: {
          type: SchemaType.STRING,
          enum: ['improving', 'stable', 'worsening', 'unclear', 'first_visit'],
          format: 'enum'
        },
        comparison: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING }
        }
      },
      required: ["status", "comparison"]
    },
    recommendedNextStep: {
      type: SchemaType.STRING,
      description: "Clear next step recommendation for the clinician."
    },
    doctorReviewRequired: {
      type: SchemaType.BOOLEAN,
      description: "Must be true."
    },
    limitations: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: "Limitations of this AI assessment (e.g. inability to physically examine)."
    }
  },
  required: [
    "assessmentStatus", 
    "riskLevel", 
    "possibleConditions", 
    "redFlags", 
    "missingInformation", 
    "currentSymptomsSummary", 
    "trendAssessment", 
    "recommendedNextStep", 
    "doctorReviewRequired", 
    "limitations"
  ]
};
