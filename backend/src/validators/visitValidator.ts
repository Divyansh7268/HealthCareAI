import { z } from 'zod';

// ─────────────────────────────────────────────────────────────
// Sub-schemas
// ─────────────────────────────────────────────────────────────
const vitalsSchema = z.object({
  temperature: z.string().optional(),
  bloodPressure: z.string().optional(),
  heartRate: z.string().optional(),
  spO2: z.string().optional(),
  respiratoryRate: z.string().optional(),
  weight: z.string().optional(),
});

const bodyLocationSchema = z.object({
  region: z.object({
    id: z.string(),
    label: z.string(),
    side: z.string(),
  }),
  side: z.string(),
  view: z.enum(['front', 'back']),
  complaint: z.string().optional(),
  severity: z.enum(['Mild', 'Moderate', 'Severe']).optional(),
});

// ─────────────────────────────────────────────────────────────
// Main request body validator
// ─────────────────────────────────────────────────────────────
export const analyzeVisitSchema = z.object({
  patientId: z.string().min(1, 'patientId is required'),
  symptoms: z.string().optional().default(''),
  duration: z.string().optional().default(''),
  additionalNotes: z.string().optional().default(''),
  vitals: vitalsSchema.optional().default({}),
  bodyLocations: z.array(bodyLocationSchema).optional().default([]),
  voiceTranscript: z.string().optional().default(''),
  imageDescriptions: z.array(z.string()).optional().default([]),
  status: z.string().optional(),
});

// ─────────────────────────────────────────────────────────────
// Zod-based AI response schema (for validating Gemini output)
// ─────────────────────────────────────────────────────────────
export const aiResponseSchema = z.object({
  riskLevel: z.enum(['low', 'moderate', 'high', 'critical']),
  possibleConditions: z.array(z.object({
    name: z.string(),
    likelihood: z.enum(['possible', 'probable', 'likely']),
    notes: z.string().optional(),
  })).min(1),
  recommendedActions: z.array(z.string()).min(1),
  urgency: z.enum(['routine', 'urgent', 'emergency']),
  treatmentSuggestions: z.array(z.string()).optional().default([]),
  referralRequired: z.boolean(),
  referralReason: z.string().optional(),
  followUpAdvice: z.string().optional(),
  confidenceScore: z.number().min(0).max(1).optional(),
  disclaimer: z.string().optional(),
});

export type AnalyzeVisitBody = z.infer<typeof analyzeVisitSchema>;
export type AIAssessmentResult = z.infer<typeof aiResponseSchema>;
