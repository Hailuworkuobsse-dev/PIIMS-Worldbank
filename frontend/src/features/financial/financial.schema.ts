import { z } from "zod";
import { FINANCING_CATEGORIES, DISBURSEMENT_STATUSES } from "./financial.types";

export const budgetFormSchema = z.object({
  projectId: z.string().uuid(),
  componentId: z.string().uuid().optional().or(z.literal("")),
  fiscalYear: z.number().int().min(2000).max(3000),
  currency: z.enum(["ETB", "USD", "EUR"]),
  appropriation: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Must be a valid amount"),
  notes: z.string().max(500).optional().or(z.literal("")),
});
export type BudgetFormData = z.infer<typeof budgetFormSchema>;

export const disbursementFormSchema = z.object({
  projectId: z.string().uuid("Select a project"),
  sourceOrgId: z.string().uuid("Select a source"),
  category: z.enum(FINANCING_CATEGORIES),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Must be a valid amount"),
  currency: z.enum(["ETB", "USD", "EUR"]),
  valueDate: z.string().min(1, "Value date is required"),
  referenceNo: z.string().max(50).optional().or(z.literal("")),
  status: z.enum(DISBURSEMENT_STATUSES).default("APPROVED"),
});
export type DisbursementFormData = z.infer<typeof disbursementFormSchema>;

export const fmisTriggerSchema = z.object({
  kind: z.enum(["APPROPRIATION", "RELEASE", "EXPENDITURE"]),
  fiscalYear: z.number().int().optional(),
});

export const disbursementFiltersSchema = z.object({
  projectId: z.string().optional(),
  status: z.array(z.enum(DISBURSEMENT_STATUSES)).optional(),
  sourceOrgId: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  q: z.string().optional(),
  limit: z.number().int().min(1).max(200).optional(),
  cursor: z.string().optional(),
});