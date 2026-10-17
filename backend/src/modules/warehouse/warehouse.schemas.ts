import { z } from 'zod';
import { AnonLevel, DatasetFormat } from '@prisma/client';

const anonValues = Object.values(AnonLevel) as [AnonLevel, ...AnonLevel[]];
const formatValues = Object.values(DatasetFormat) as [DatasetFormat, ...DatasetFormat[]];

export const anonymizeSchema = z.object({
  waveId: z.string().uuid('Select a wave'),
  config: z.object({
    level: z.enum(anonValues),
    ageBracket: z.coerce.number().int().min(0).max(20).default(5),
    incomeTopCode: z.coerce.number().int().min(1).max(100).default(99),
    locationGranularity: z.enum(['REGION', 'ZONE', 'WOREDA', 'KEBELE', 'REMOVED']).default('ZONE'),
    suppressionThreshold: z.coerce.number().int().min(0).default(5),
    addNoise: z.boolean().default(false)
  })
});
export type AnonymizeInput = z.infer<typeof anonymizeSchema>;

export const buildWaveDatasetSchema = z.object({
  waveId: z.string().uuid()
});
export type BuildWaveDatasetInput = z.infer<typeof buildWaveDatasetSchema>;

export const dataRequestSchema = z.object({
  researcherName: z.string().trim().min(2).max(200),
  researcherEmail: z.string().email(),
  institution: z.string().trim().min(2).max(200),
  purpose: z.string().trim().min(20).max(2000)
});
export type DataRequestInput = z.infer<typeof dataRequestSchema>;

export const releaseDatasetSchema = z.object({
  formats: z.array(z.enum(formatValues)).min(1)
});