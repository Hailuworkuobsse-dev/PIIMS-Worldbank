import { z } from 'zod';
import {
  ProjectStatus, ProjectSector, ImplArrangement
} from '@prisma/client';

/* ─── Shared ─────────────────────────────────────────────────────── */

const moneySchema = z.object({
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid amount'),
  currency: z.enum(['ETB', 'USD', 'EUR'])
});

const financingLineSchema = z.object({
  source: z.enum(['WORLD_BANK', 'GOVERNMENT', 'DBE', 'OTHER']),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid amount'),
  currency: z.enum(['ETB', 'USD', 'EUR']),
  referenceNo: z.string().max(50).optional().or(z.literal(''))
});

export const locationSchema = z.object({
  region: z.string().trim().min(1, 'Region is required').max(100),
  zone: z.string().trim().max(100).optional().or(z.literal('')),
  woreda: z.string().trim().max(100).optional().or(z.literal('')),
  kebele: z.string().trim().max(100).optional().or(z.literal('')),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional()
});

/* ─── Create ─────────────────────────────────────────────────────── */

export const createProjectSchema = z
  .object({
    name: z.string().trim().min(3, 'Name must be at least 3 chars').max(300),
    nameAm: z.string().trim().max(300).optional().or(z.literal('')),
    description: z.string().trim().max(2000).optional().or(z.literal('')),
    subsector: z.string().trim().max(100).optional().or(z.literal('')),

    sector: z.nativeEnum(ProjectSector),
    ownerOrgId: z.string().uuid('ownerOrgId must be a UUID'),
    implementationArrangement: z.nativeEnum(ImplArrangement).optional(),
    wbCreditNo: z.string().trim().max(50).optional().or(z.literal('')),

    // Location flattened from wizard
    region: z.string().trim().min(1, 'Region is required').max(100),
    zone: z.string().trim().max(100).optional().or(z.literal('')),
    woreda: z.string().trim().max(100).optional().or(z.literal('')),
    kebele: z.string().trim().max(100).optional().or(z.literal('')),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),

    totalBudget: moneySchema,
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD').optional().or(z.literal('')),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD').optional().or(z.literal('')),
    financingSource: z.array(financingLineSchema).optional()
  })
  .refine(
    (d) =>
      !d.startDate || !d.endDate || new Date(d.endDate) > new Date(d.startDate),
    { path: ['endDate'], message: 'End date must be after start date' }
  )
  .refine(
    (d) => {
      if (!d.financingSource?.length) return true;
      const sum = d.financingSource.reduce((s, l) => s + Number(l.amount), 0);
      return Math.abs(sum - Number(d.totalBudget.amount)) < 0.01;
    },
    {
      path: ['financingSource'],
      message: 'Financing sources must sum to the total budget'
    }
  );
export type CreateProjectInput = z.infer<typeof createProjectSchema>;

/* ─── Update ─────────────────────────────────────────────────────── */

export const updateProjectSchema = z.object({
  // Optimistic lock — must match the current version
  version: z.number().int().min(1),

  name: z.string().trim().min(1).max(300).optional(),
  nameAm: z.string().trim().max(300).optional().nullable(),
  description: z.string().trim().max(2000).optional().nullable(),
  subsector: z.string().trim().max(100).optional().nullable(),
  sector: z.nativeEnum(ProjectSector).optional(),
  implementationArrangement: z.nativeEnum(ImplArrangement).optional().nullable(),
  wbCreditNo: z.string().trim().max(50).optional().nullable(),
  totalBudget: moneySchema.optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  financingSource: z.array(financingLineSchema).optional().nullable()
});
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

/* ─── Stage advance ──────────────────────────────────────────────── */

const CHECKLISTS: Record<string, string[]> = {
  PROFILE: ['identification_complete'],
  PRE_FEASIBILITY: ['profile_approved'],
  FEASIBILITY: ['pre_feasibility_approved'],
  APPRAISAL: ['feasibility_approved', 'budget_drafted'],
  APPROVED: ['appraisal_approved', 'wb_no_objection'],
  ACTIVE: ['start_conditions_met'],
  CLOSED: ['final_report_submitted'],
  CANCELLED: ['cancellation_approved']
};

export const stageAdvanceSchema = z
  .object({
    targetStage: z.nativeEnum(ProjectStatus),
    checklist: z.record(z.boolean()).default({}),
    notes: z.string().max(1000).optional()
  })
  .refine(
    (d) => {
      const required = CHECKLISTS[d.targetStage] ?? [];
      return required.every((k) => d.checklist[k] === true);
    },
    {
      path: ['checklist'],
      message: 'All required pre-conditions must be confirmed'
    }
  );
export type StageAdvanceInput = z.infer<typeof stageAdvanceSchema>;

export const STAGE_CHECKLISTS = CHECKLISTS;

/* ─── List query ─────────────────────────────────────────────────── */

export const listProjectsQuerySchema = z.object({
  q: z.string().optional(),
  status: z.string().optional(),         // comma-separated
  sector: z.string().optional(),         // comma-separated
  region: z.string().optional(),
  owner_org_id: z.string().uuid().optional(),
  created_after: z.string().optional(),
  created_before: z.string().optional(),
  sort: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).optional()
});
export type ListProjectsQuery = z.infer<typeof listProjectsQuerySchema>;

/* ─── Bulk import ────────────────────────────────────────────────── */

export const bulkImportProjectsSchema = z.object({
  rows: z
    .array(
      z.object({
        name: z.string().trim().min(3).max(300),
        sector: z.nativeEnum(ProjectSector),
        ownerOrgId: z.string().uuid(),
        region: z.string().trim().min(1).max(100),
        totalBudget: z.string().regex(/^\d+(\.\d{1,2})?$/),
        currency: z.enum(['ETB', 'USD', 'EUR']),
        startDate: z.string().optional().or(z.literal('')),
        endDate: z.string().optional().or(z.literal(''))
      })
    )
    .min(1, 'At least one row required')
    .max(500, 'Maximum 500 rows per import')
});
export type BulkImportProjectsInput = z.infer<typeof bulkImportProjectsSchema>;