import { z } from "zod";
import { PROCUREMENT_METHODS, CONTRACT_STATUSES } from "./procurement.types";

export const procurementFormSchema = z.object({
  projectId: z.string().uuid("Select a project"),
  componentId: z.string().uuid().optional().or(z.literal("")),
  planRef: z.string().trim().min(1, "Plan reference is required").max(50),
  description: z.string().trim().min(5, "Description is required").max(500),
  method: z.enum(PROCUREMENT_METHODS),
  estimatedAmount: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Must be a valid amount"),
  currency: z.enum(["ETB", "USD", "EUR"]),
  planDate: z.string().min(1, "Planned date is required"),
});
export type ProcurementFormData = z.infer<typeof procurementFormSchema>;

export const contractFormSchema = z
  .object({
    procurementId: z.string().uuid().optional().or(z.literal("")),
    projectId: z.string().uuid(),
    supplierId: z.string().uuid("Select a supplier"),
    contractNo: z.string().trim().min(1, "Contract number is required").max(50),
    title: z.string().trim().min(5, "Title is required").max(300),
    amount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Must be a valid amount"),
    currency: z.enum(["ETB", "USD", "EUR"]),
    signedDate: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    status: z.enum(CONTRACT_STATUSES).default("DRAFT"),
  })
  .refine(
    (d) =>
      !d.startDate ||
      !d.endDate ||
      Date.parse(d.endDate) > Date.parse(d.startDate),
    { path: ["endDate"], message: "End date must be after start date" },
  );
export type ContractFormData = z.infer<typeof contractFormSchema>;