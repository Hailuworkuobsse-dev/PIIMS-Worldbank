import { z } from 'zod';
import { ProcurementMethod, ProcurementStatus, ContractStatus } from '@prisma/client';

const methodValues = Object.values(ProcurementMethod) as [ProcurementMethod, ...ProcurementMethod[]];
const procStatusValues = Object.values(ProcurementStatus) as [ProcurementStatus, ...ProcurementStatus[]];
const contractStatusValues = Object.values(ContractStatus) as [ContractStatus, ...ContractStatus[]];

/* ─── Procurement ────────────────────────────────────────────────── */

export const createProcurementSchema = z.object({
  projectId: z.string().uuid('Select a project'),
  componentId: z.string().uuid().optional().or(z.literal('')),
  planRef: z.string().trim().min(1).max(50),
  description: z.string().trim().min(5).max(500),
  method: z.enum(methodValues),
  estimatedAmount: z.string().regex(/^\d+(\.\d{1,2})?$/).optional().or(z.literal('')),
  currency: z.enum(['ETB', 'USD', 'EUR']),
  planDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal(''))
});
export type CreateProcurementInput = z.infer<typeof createProcurementSchema>;

export const updateProcurementSchema = z.object({
  description: z.string().trim().min(5).max(500).optional(),
  estimatedAmount: z.string().regex(/^\d+(\.\d{1,2})?$/).optional().nullable(),
  advertisementDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  bidOpeningDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  evaluationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  awardDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  status: z.enum(procStatusValues).optional()
});
export type UpdateProcurementInput = z.infer<typeof updateProcurementSchema>;

export const listProcurementQuerySchema = z.object({
  project_id: z.string().uuid().optional(),
  status: z.string().optional(),
  method: z.string().optional(),
  q: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).optional()
});
export type ListProcurementQuery = z.infer<typeof listProcurementQuerySchema>;

/* ─── Contracts ──────────────────────────────────────────────────── */

export const createContractSchema = z.object({
  procurementId: z.string().uuid().optional().or(z.literal('')),
  projectId: z.string().uuid(),
  supplierId: z.string().uuid('Select a supplier'),
  contractNo: z.string().trim().min(1).max(50),
  title: z.string().trim().min(5).max(300),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/),
  currency: z.enum(['ETB', 'USD', 'EUR']),
  signedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')),
  status: z.enum(contractStatusValues).default(ContractStatus.DRAFT)
}).refine(
  (d) => !d.startDate || !d.endDate || new Date(d.endDate) > new Date(d.startDate),
  { path: ['endDate'], message: 'End date must be after start date' }
);
export type CreateContractInput = z.infer<typeof createContractSchema>;

export const updateContractSchema = z.object({
  title: z.string().trim().min(5).max(300).optional(),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  signedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  status: z.enum(contractStatusValues).optional()
});
export type UpdateContractInput = z.infer<typeof updateContractSchema>;

export const listContractsQuerySchema = z.object({
  project_id: z.string().uuid().optional(),
  supplier_id: z.string().uuid().optional(),
  status: z.string().optional(),
  q: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).optional()
});
export type ListContractsQuery = z.infer<typeof listContractsQuerySchema>;

/* ─── Delays ─────────────────────────────────────────────────────── */

export const delaysQuerySchema = z.object({
  project_id: z.string().uuid().optional()
});
export type DelaysQuery = z.infer<typeof delaysQuerySchema>;