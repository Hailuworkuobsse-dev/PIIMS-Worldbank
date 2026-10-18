import { z } from 'zod';
import { ImpactDirection } from '@prisma/client';

const directionValues = Object.values(ImpactDirection) as [ImpactDirection, ...ImpactDirection[]];

export const createDomainSchema = z.object({
  code: z.string().trim().min(1).max(20).regex(/^[A-Z][A-Z0-9_]*$/),
  name: z.string().trim().min(2).max(100),
  nameAm: z.string().trim().max(100).optional().or(z.literal('')),
  description: z.string().trim().max(500).optional().or(z.literal('')),
  orderNo: z.coerce.number().int().min(0).default(0)
});
export type CreateDomainInput = z.infer<typeof createDomainSchema>;

export const createImpactIndicatorSchema = z.object({
  domainId: z.string().uuid('Select a domain'),
  code: z.string().trim().min(1).max(30).regex(/^[A-Z][A-Z0-9-]*$/),
  name: z.string().trim().min(3).max(300),
  nameAm: z.string().trim().max(300).optional().or(z.literal('')),
  description: z.string().trim().max(1000).optional().or(z.literal('')),
  unit: z.string().trim().min(1).max(50),
  direction: z.enum(directionValues),
  method: z.string().trim().max(500).optional().or(z.literal('')),
  disaggregation: z.array(z.string()).default([]),
  standardRef: z.string().trim().max(100).optional().or(z.literal('')),
  effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  isComposite: z.boolean().default(false),
  compositeFormula: z.object({
    components: z.array(z.object({
      indicatorId: z.string().uuid(),
      weight: z.number().min(0).max(100)
    })).min(2),
    normalization: z.enum(['MIN_MAX', 'Z_SCORE', 'NONE']).default('MIN_MAX'),
    aggregation: z.enum(['WEIGHTED_SUM', 'WEIGHTED_AVG']).default('WEIGHTED_AVG')
  }).optional()
}).refine(
  (d) => !d.isComposite || d.compositeFormula,
  { path: ['compositeFormula'], message: 'Composite indicators require a formula' }
).refine(
  (d) => {
    if (!d.isComposite || !d.compositeFormula) return true;
    const sum = d.compositeFormula.components.reduce((s, c) => s + c.weight, 0);
    return Math.abs(sum - 100) < 0.01;
  },
  { path: ['compositeFormula'], message: 'Component weights must sum to 100' }
);
export type CreateImpactIndicatorInput = z.infer<typeof createImpactIndicatorSchema>;

export const waveAssignmentSchema = z.object({
  waveId: z.string().uuid('Select a wave'),
  targetValue: z.coerce.number().optional(),
  collectionWindowStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')),
  collectionWindowEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')),
  required: z.boolean().default(true)
});
export type WaveAssignmentInput = z.infer<typeof waveAssignmentSchema>;

export const listIndicatorsQuerySchema = z.object({
  domain_id: z.string().uuid().optional(),
  status: z.string().optional(),
  q: z.string().optional()
});
export type ListIndicatorsQuery = z.infer<typeof listIndicatorsQuerySchema>;