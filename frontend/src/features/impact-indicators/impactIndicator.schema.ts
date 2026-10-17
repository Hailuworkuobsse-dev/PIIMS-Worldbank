import { z } from "zod";
import { IMPACT_DOMAINS, INDICATOR_DIRECTION } from "./impactIndicator.types";

export const impactIndicatorSchema = z.object({
  domain: z.enum(IMPACT_DOMAINS),
  code: z.string().trim().min(1).max(30),
  name: z.string().trim().min(3, "Name is required").max(300),
  nameAm: z.string().trim().max(300).optional().or(z.literal("")),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  unit: z.string().trim().min(1, "Unit is required").max(50),
  direction: z.enum(INDICATOR_DIRECTION),
  method: z.string().trim().max(500).optional().or(z.literal("")),
  disaggregation: z.array(z.string()).default([]),
  standardRef: z.string().trim().max(100).optional().or(z.literal("")),
  effectiveFrom: z.string().min(1, "Effective date is required"),
});
export type ImpactIndicatorFormData = z.infer<typeof impactIndicatorSchema>;

export const waveAssignmentSchema = z.object({
  indicatorId: z.string().uuid(),
  waveId: z.string().uuid(),
  targetValue: z.number().optional(),
  collectionWindowStart: z.string().optional().or(z.literal("")),
  collectionWindowEnd: z.string().optional().or(z.literal("")),
  required: z.boolean().default(true),
});
export type WaveAssignmentFormData = z.infer<typeof waveAssignmentSchema>;

export const compositeSchema = z
  .object({
    name: z.string().trim().min(3).max(200),
    components: z
      .array(
        z.object({
          indicatorId: z.string().uuid(),
          weight: z.number().min(0).max(100),
        }),
      )
      .min(2, "At least two components required"),
    normalization: z.enum(["MIN_MAX", "Z_SCORE", "NONE"]).default("MIN_MAX"),
    aggregation: z
      .enum(["WEIGHTED_SUM", "WEIGHTED_AVG"])
      .default("WEIGHTED_AVG"),
  })
  .refine(
    (d) => {
      const sum = d.components.reduce((s, c) => s + c.weight, 0);
      return Math.abs(sum - 100) < 0.01;
    },
    { path: ["components"], message: "Weights must sum to 100" },
  );
export type CompositeFormData = z.infer<typeof compositeSchema>;