import { z } from "zod";
import {
  PROJECT_SECTORS,
  IMPL_ARRANGEMENTS,
  FINANCING_SOURCES,
  PROJECT_STATUSES,
} from "./project.types";

/* -------------------------------------------------------------------------
 * Money — string decimal per API
 * ------------------------------------------------------------------------- */
const moneySchema = z.object({
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Must be a valid amount"),
  currency: z.enum(["ETB", "USD", "EUR"]),
});

/* -------------------------------------------------------------------------
 * Create project — matches wizard steps
 * ------------------------------------------------------------------------- */
export const stepIdentificationSchema = z.object({
  name: z.string().trim().min(3, "Name must be at least 3 characters").max(300),
  nameAm: z.string().trim().max(300).optional().or(z.literal("")),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  subsector: z.string().trim().max(100).optional().or(z.literal("")),
});
export type StepIdentificationData = z.infer<typeof stepIdentificationSchema>;

export const stepClassificationSchema = z.object({
  sector: z.enum(PROJECT_SECTORS),
  ownerOrgId: z.string().uuid("Select a lead organization"),
  implementationArrangement: z.enum(IMPL_ARRANGEMENTS),
  wbCreditNo: z.string().trim().max(50).optional().or(z.literal("")),
});
export type StepClassificationData = z.infer<typeof stepClassificationSchema>;

export const stepLocationSchema = z.object({
  region: z.string().min(1, "Region is required"),
  zone: z.string().optional().or(z.literal("")),
  woreda: z.string().optional().or(z.literal("")),
  kebele: z.string().optional().or(z.literal("")),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});
export type StepLocationData = z.infer<typeof stepLocationSchema>;

const financingLineSchema = z.object({
  source: z.enum(FINANCING_SOURCES),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Must be a valid amount"),
  currency: z.enum(["ETB", "USD", "EUR"]),
  referenceNo: z.string().optional().or(z.literal("")),
});

const stepBudgetObjectSchema = z.object({
  totalBudget: moneySchema,
  startDate: z
    .string()
    .refine((s) => !s || !Number.isNaN(Date.parse(s)), "Invalid date")
    .optional(),
  endDate: z.string().optional(),
  financingSource: z
    .array(financingLineSchema)
    .min(1, "At least one financing source is required"),
});

const budgetDatesInOrder = (d: { startDate?: string; endDate?: string }) =>
  !d.startDate ||
  !d.endDate ||
  Date.parse(d.endDate) > Date.parse(d.startDate);

export const stepBudgetSchema = stepBudgetObjectSchema.refine(
  budgetDatesInOrder,
  { path: ["endDate"], message: "End date must be after start date" },
);
export type StepBudgetData = z.infer<typeof stepBudgetSchema>;

/* Merged object schema (no refinements) — needed for .merge()/.partial() */
const createProjectObjectSchema = stepIdentificationSchema
  .merge(stepClassificationSchema)
  .merge(stepLocationSchema)
  .merge(stepBudgetObjectSchema);

export const createProjectSchema = createProjectObjectSchema
  .refine(budgetDatesInOrder, {
    path: ["endDate"],
    message: "End date must be after start date",
  })
  .refine(
    (d) => {
      const declared = d.financingSource.reduce(
        (sum, l) => sum + Number(l.amount),
        0,
      );
      return Math.abs(declared - Number(d.totalBudget.amount)) < 0.01;
    },
    {
      path: ["financingSource"],
      message: "Financing sources must sum to the total budget",
    },
  );
export type CreateProjectInput = z.infer<typeof createProjectSchema>;

/* -------------------------------------------------------------------------
 * Update
 * ------------------------------------------------------------------------- */
export const updateProjectSchema = createProjectObjectSchema.partial();
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

/* -------------------------------------------------------------------------
 * Filters (URL-serialisable)
 * ------------------------------------------------------------------------- */
export const projectFiltersSchema = z.object({
  q: z.string().optional(),
  status: z.array(z.enum(PROJECT_STATUSES)).optional(),
  sector: z.array(z.enum(PROJECT_SECTORS)).optional(),
  region: z.string().optional(),
  ownerOrgId: z.string().optional(),
  sort: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(200).optional(),
});
export type ProjectFiltersInput = z.infer<typeof projectFiltersSchema>;

/* -------------------------------------------------------------------------
 * Stage advance
 * ------------------------------------------------------------------------- */
export const stageAdvanceSchema = z.object({
  targetStage: z.enum(PROJECT_STATUSES),
  checklist: z.record(z.boolean()),
  notes: z.string().max(1000).optional(),
});
export type StageAdvanceInput = z.infer<typeof stageAdvanceSchema>;

/* -------------------------------------------------------------------------
 * Wizard step registry — drives WizardShell
 * ------------------------------------------------------------------------- */
export const WIZARD_STEPS = [
  {
    id: "identification",
    labelKey: "projects.wizard.steps.identification",
    schema: stepIdentificationSchema,
  },
  {
    id: "classification",
    labelKey: "projects.wizard.steps.classification",
    schema: stepClassificationSchema,
  },
  {
    id: "location",
    labelKey: "projects.wizard.steps.location",
    schema: stepLocationSchema,
  },
  {
    id: "budget",
    labelKey: "projects.wizard.steps.budget",
    schema: stepBudgetSchema,
  },
  {
    id: "review",
    labelKey: "projects.wizard.steps.review",
    schema: createProjectSchema,
  },
] as const;
export type WizardStepId = (typeof WIZARD_STEPS)[number]["id"];