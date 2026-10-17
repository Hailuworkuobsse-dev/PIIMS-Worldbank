import { z } from "zod";
import {
  GRIEVANCE_CATEGORIES,
  GRIEVANCE_CHANNELS,
  SEVERITIES,
} from "./grievance.types";

export const grievanceIntakeSchema = z.object({
  projectId: z.string().uuid().optional().or(z.literal("")),
  beneficiaryId: z.string().uuid().optional().or(z.literal("")),
  category: z.enum(GRIEVANCE_CATEGORIES),
  subcategory: z.string().trim().max(100).optional().or(z.literal("")),
  description: z
    .string()
    .trim()
    .min(10, "Description must be at least 10 characters")
    .max(2000),
  channel: z.enum(GRIEVANCE_CHANNELS),
  severity: z.enum(SEVERITIES),
  location: z
    .object({
      region: z.string().optional().or(z.literal("")),
      woreda: z.string().optional().or(z.literal("")),
      kebele: z.string().optional().or(z.literal("")),
    })
    .optional(),
  anonymous: z.boolean().default(false),
});
export type GrievanceIntakeFormData = z.infer<typeof grievanceIntakeSchema>;

export const grievanceAssignSchema = z.object({
  assignedTo: z.string().uuid("Select an officer"),
  notes: z.string().max(500).optional(),
});
export type GrievanceAssignFormData = z.infer<typeof grievanceAssignSchema>;

export const grievanceResolveSchema = z.object({
  resolution: z
    .string()
    .trim()
    .min(20, "Resolution must be at least 20 characters")
    .max(2000),
  notes: z.string().max(500).optional(),
});
export type GrievanceResolveFormData = z.infer<typeof grievanceResolveSchema>;

export const grievanceEscalateSchema = z.object({
  escalatedTo: z.string().uuid("Select an officer"),
  reason: z.string().trim().min(10, "Reason is required").max(500),
});
export type GrievanceEscalateFormData = z.infer<typeof grievanceEscalateSchema>;