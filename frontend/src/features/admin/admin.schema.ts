import { z } from "zod";
import { USER_STATUSES } from "./admin.types";

const phoneRegex = /^(\+251|0)[79]\d{8}$/;

export const createUserSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Username min 3 chars")
    .max(60)
    .regex(
      /^[a-z0-9._-]+$/i,
      "Only letters, numbers, dots, hyphens, underscores",
    ),
  email: z.string().email("Enter a valid email"),
  fullName: z.string().trim().min(2).max(200),
  fullNameAm: z.string().trim().max(200).optional().or(z.literal("")),
  phone: z
    .string()
    .regex(phoneRegex, "Enter a valid Ethiopian phone")
    .optional()
    .or(z.literal("")),
  orgId: z.string().uuid("Select an organization"),
  role: z.string().min(1, "Select a role"),
  mfaEnabled: z.boolean().default(false),
  sendInvite: z.boolean().default(true),
});
export type CreateUserFormData = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  fullName: z.string().trim().min(2).max(200).optional(),
  fullNameAm: z.string().trim().max(200).optional().or(z.literal("")),
  email: z.string().email().optional(),
  phone: z.string().regex(phoneRegex).optional().or(z.literal("")),
  orgId: z.string().uuid().optional(),
  role: z.string().min(1).optional(),
  status: z.enum(USER_STATUSES).optional(),
  mfaEnabled: z.boolean().optional(),
});
export type UpdateUserFormData = z.infer<typeof updateUserSchema>;

export const auditFiltersSchema = z.object({
  userId: z.string().optional(),
  entity: z.string().optional(),
  action: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  q: z.string().optional(),
  limit: z.number().int().min(1).max(500).optional(),
  cursor: z.string().optional(),
});