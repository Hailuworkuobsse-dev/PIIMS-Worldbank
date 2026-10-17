import { z } from 'zod';

export const submissionConsentSchema = z.object({
  participation: z.boolean(),
  data_use: z.boolean(),
  future_research: z.boolean().default(false),
  media: z.boolean().default(false),
  contact: z.boolean().default(false),
  consent_version: z.string().min(1),
  language: z.enum(['en', 'am']).default('en')
});

export const submissionAnswerSchema = z.object({
  questionId: z.string().uuid(),
  valueType: z.enum(['TEXT', 'NUMERIC', 'DATE', 'JSON', 'GPS', 'MEDIA']),
  valueText: z.string().optional(),
  valueNumeric: z.number().optional(),
  valueDate: z.string().optional(),
  valueJson: z.record(z.unknown()).optional(),
  valueGps: z.object({ lat: z.number(), lon: z.number() }).optional()
});

export const paradataSchema = z.object({
  questionId: z.string().uuid().optional(),
  timeSpentMs: z.number().int().min(0),
  editCount: z.number().int().min(0).default(0),
  interrupted: z.boolean().default(false)
});

export const submitInterviewSchema = z.object({
  assignmentId: z.string().uuid(),
  beneficiaryId: z.string().uuid().optional().or(z.literal('')),
  panelId: z.string().uuid().optional().or(z.literal('')),
  startedAt: z.string().datetime(),
  endedAt: z.string().datetime().optional(),
  durationSeconds: z.coerce.number().int().min(0).optional(),
  gpsStart: z.object({ lat: z.number(), lon: z.number() }).optional(),
  gpsEnd: z.object({ lat: z.number(), lon: z.number() }).optional(),
  deviceId: z.string().max(100).optional().or(z.literal('')),
  consent: submissionConsentSchema,
  answers: z.array(submissionAnswerSchema).min(1),
  paradata: z.array(paradataSchema).default([]),
  checksum: z.string().optional().or(z.literal(''))
}).refine((d) => d.consent.participation && d.consent.data_use, {
  path: ['consent'], message: 'Participation and data use consent are required'
});
export type SubmitInterviewInput = z.infer<typeof submitInterviewSchema>;