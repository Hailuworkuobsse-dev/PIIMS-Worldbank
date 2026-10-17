import { z } from 'zod';
import { DisbursementStatus, FinancingCategory } from '@prisma/client';

const disbursementStatusValues = Object.values(DisbursementStatus) as [DisbursementStatus, ...DisbursementStatus[]];
const financingCategoryValues = Object.values(FinancingCategory) as [FinancingCategory, ...FinancingCategory[]];

/* ─── Budgets ────────────────────────────────────────────────────── */

export const createBudgetSchema = z.object({
  projectId: z.string().uuid('Select a project'),
  componentId: z.string().uuid().optional().or(z.literal('')),
  fiscalYear: z.coerce.number().int().min(2000).max(3000),
  currency: z.enum(['ETB', 'USD', 'EUR']),
  appropriation: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Valid amount required'),
  notes: z.string().max(500).optional().or(z.literal(''))
});
export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;

export const listBudgetsQuerySchema = z.object({
  project_id: z.string().uuid('project_id required'),
  fiscal_year: z.coerce.number().int().optional(),
  component_id: z.string().uuid().optional()
});
export type ListBudgetsQuery = z.infer<typeof listBudgetsQuerySchema>;

/* ─── Disbursements ──────────────────────────────────────────────── */

export const createDisbursementSchema = z.object({
  projectId: z.string().uuid('Select a project'),
  sourceOrgId: z.string().uuid('Select a source'),
  category: z.enum(financingCategoryValues),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Valid amount required'),
  currency: z.enum(['ETB', 'USD', 'EUR']),
  valueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD required'),
  referenceNo: z.string().max(50).optional().or(z.literal('')),
  status: z.enum(disbursementStatusValues).default(DisbursementStatus.APPROVED)
});
export type CreateDisbursementInput = z.infer<typeof createDisbursementSchema>;

export const listDisbursementsQuerySchema = z.object({
  project_id: z.string().uuid().optional(),
  source_org_id: z.string().uuid().optional(),
  status: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  q: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).optional()
});
export type ListDisbursementsQuery = z.infer<typeof listDisbursementsQuerySchema>;

/* ─── Execution ──────────────────────────────────────────────────── */

export const executionQuerySchema = z.object({
  project_id: z.string().uuid('project_id required'),
  fiscal_year: z.coerce.number().int().optional()
});
export type ExecutionQuery = z.infer<typeof executionQuerySchema>;

/* ─── FMIS sync ──────────────────────────────────────────────────── */

export const fmisSyncSchema = z.object({
  kind: z.enum(['APPROPRIATION', 'RELEASE', 'EXPENDITURE']).default('EXPENDITURE')
});
export type FmisSyncInput = z.infer<typeof fmisSyncSchema>;

/* ─── Cost per output ────────────────────────────────────────────── */

export const costPerOutputQuerySchema = z.object({
  project_id: z.string().uuid('project_id required')
});
export type CostPerOutputQuery = z.infer<typeof costPerOutputQuerySchema>;

/* ─── Exceptions ─────────────────────────────────────────────────── */

export const exceptionsQuerySchema = z.object({
  project_id: z.string().uuid().optional()
});
export type ExceptionsQuery = z.infer<typeof exceptionsQuerySchema>;