import { z } from "zod";
import {
  INDICATOR_TYPES,
  INDICATOR_FREQUENCIES,
  INDICATOR_DIRECTIONS,
} from "./results.types";

export const componentSchema = z.object({
  code: z.string().trim().min(1, "Code is required").max(20),
  name: z.string().trim().min(3, "Name is required").max(200),
  nameAm: z.string().trim().max(200).optional().or(z.literal("")),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  budget: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/)
    .optional()
    .or(z.literal("")),
  responsibleOrgId: z.string().optional().or(z.literal("")),
  orderNo: z.number().int().min(0),
});
export type ComponentInput = z.infer<typeof componentSchema>;

export const subcomponentSchema = componentSchema.extend({
  componentId: z.string().uuid(),
});
export type SubComponentInput = z.infer<typeof subcomponentSchema>;

export const indicatorSchema = z.object({
  subcomponentId: z.string().uuid("Select a subcomponent"),
  code: z.string().trim().min(1).max(30),
  name: z.string().trim().min(3).max(300),
  nameAm: z.string().trim().max(300).optional().or(z.literal("")),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  indicatorType: z.enum(INDICATOR_TYPES),
  unit: z.string().trim().min(1, "Unit is required").max(50),
  baseline: z.number().optional(),
  baselineDate: z.string().optional(),
  target: z.number().optional(),
  targetDate: z.string().optional(),
  frequency: z.enum(INDICATOR_FREQUENCIES),
  direction: z.enum(INDICATOR_DIRECTIONS),
  method: z.string().trim().max(500).optional().or(z.literal("")),
  disaggregation: z.array(z.string()).optional(),
});
export type IndicatorInput = z.infer<typeof indicatorSchema>;

export const indicatorValueSchema = z.object({
  period: z.string().min(1, "Period is required"),
  fiscalYear: z.number().int().min(2000).max(3000),
  value: z.number({ invalid_type_error: "Enter a numeric value" }),
  target: z.number().optional(),
  dataSource: z.string().trim().max(200).optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
  disaggregation: z.record(z.record(z.number())).optional(),
});
export type IndicatorValueInput = z.infer<typeof indicatorValueSchema>;