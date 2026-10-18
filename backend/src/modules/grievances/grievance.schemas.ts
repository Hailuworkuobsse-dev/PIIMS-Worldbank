import { z } from 'zod';
import {
  GrievanceCategory, GrievanceChannel, Severity
} from '@prisma/client';

const catValues = Object.values(GrievanceCategory) as [GrievanceCategory, ...GrievanceCategory[]];
const chanValues = Object.values(GrievanceChannel) as [GrievanceChannel, ...GrievanceChannel[]];
const sevValues = Object.values(Severity) as [Severity, ...Severity[]];

export const createGrievanceSchema = z.object({
  projectId: z.string().uuid().optional().or(z.literal('')),
  beneficiaryId: z.string().uuid().optional().or(z.literal('')),
  category: z.enum(catValues),
  subcategory: z.string().trim().max(100).optional().or(z.literal('')),
  description: z.string().trim().min(10, 'Description must be at least 10 chars').max(2000),
  channel: z.enum(chanValues).default('IN_PERSON'),
  severity: z.enum(sevValues).default('MEDIUM'),
  location: z.object({
    region: z.string().optional().or(z.literal('')),
    woreda: z.string().optional().or(z.literal('')),
    kebele: z.string().optional().or(z.literal(''))
  }).optional(),
  anonymous: z.boolean().default(false)
});
export type CreateGrievanceInput = z.infer<typeof createGrievanceSchema>;

export const listGrievancesQuerySchema = z.object({
  project_id: z.string().uuid().optional(),
  category: z.string().optional(),
  status: z.string().optional(),
  severity: z.string().optional(),
  assigned_to: z.string().uuid().optional(),
  overdue: z.coerce.boolean().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  q: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  cursor: z.string().optional()
});
export type ListGrievancesQuery = z.infer<typeof listGrievancesQuerySchema>;

export const assignSchema = z.object({
  assignedTo: z.string().uuid('Select an officer'),
  notes: z.string().max(500).optional().or(z.literal(''))
});
export type AssignInput = z.infer<typeof assignSchema>;

export const resolveSchema = z.object({
  resolution: z.string().trim().min(20, 'Resolution must be at least 20 chars').max(2000),
  notes: z.string().max(500).optional().or(z.literal(''))
});
export type ResolveInput = z.infer<typeof resolveSchema>;

export const escalateSchema = z.object({
  escalatedTo: z.string().uuid('Select an officer'),
  reason: z.string().trim().min(10, 'Reason is required').max(500)
});
export type EscalateInput = z.infer<typeof escalateSchema>;

export const statsQuerySchema = z.object({
  project_id: z.string().uuid().optional()
});
export type StatsQuery = z.infer<typeof statsQuerySchema>;