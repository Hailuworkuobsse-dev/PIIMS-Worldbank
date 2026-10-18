import { z } from 'zod';
import { QaRuleType, Severity } from '@prisma/client';

const ruleTypeValues = Object.values(QaRuleType) as [QaRuleType, ...QaRuleType[]];
const severityValues = Object.values(Severity) as [Severity, ...Severity[]];

export const createQaRuleSchema = z.object({
  code: z.string().trim().min(2).max(40).regex(/^[A-Z][A-Z0-9_]*$/),
  name: z.string().trim().min(3).max(200),
  type: z.enum(ruleTypeValues),
  threshold: z.record(z.union([z.number(), z.string()])),
  severity: z.enum(severityValues),
  active: z.boolean().default(true)
});
export type CreateQaRuleInput = z.infer<typeof createQaRuleSchema>;

export const reviewFlagSchema = z.object({
  decision: z.enum(['ACCEPT', 'REJECT', 'BACK_CHECK']),
  notes: z.string().max(1000).optional().or(z.literal(''))
});
export type ReviewFlagInput = z.infer<typeof reviewFlagSchema>;

export const backCheckSchema = z.object({
  submissionId: z.string().uuid(),
  result: z.enum(['PASS', 'PARTIAL', 'FAIL']),
  mismatchPct: z.coerce.number().min(0).max(100).optional(),
  notes: z.string().max(1000).optional().or(z.literal(''))
});
export type BackCheckInput = z.infer<typeof backCheckSchema>;

export const listFlagsQuerySchema = z.object({
  wave_id: z.string().uuid().optional(),
  project_id: z.string().uuid().optional(),
  severity: z.string().optional(),
  status: z.string().optional(),
  collector_id: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  cursor: z.string().optional()
});
export type ListFlagsQuery = z.infer<typeof listFlagsQuerySchema>;

export const statsQuerySchema = z.object({ wave_id: z.string().uuid().optional() });