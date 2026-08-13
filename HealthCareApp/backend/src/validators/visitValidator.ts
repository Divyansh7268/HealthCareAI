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



export type AnalyzeVisitBody = z.infer<typeof analyzeVisitSchema>;
