import { z } from 'zod';
import { UserStatus } from '@prisma/client';

const phoneRegex = /^(\+251|0)[79]\d{8}$/;

/* ─── Users ──────────────────────────────────────────────────────── */

export const listUsersQuerySchema = z.object({
  q: z.string().optional(),
  status: z.string().optional(),
  org_id: z.string().uuid().optional(),
  role: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).optional()
});
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;

export const createUserSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3)
    .max(60)
    .regex(/^[a-z0-9._-]+$/i, 'Only letters, numbers, dots, hyphens, underscores'),
  email: z.string().trim().email('Enter a valid email'),
  fullName: z.string().trim().min(2).max(200),
  fullNameAm: z.string().trim().max(200).optional().or(z.literal('')),
  phone: z.string().regex(phoneRegex, 'Enter a valid Ethiopian phone').optional().or(z.literal('')),
  orgId: z.string().uuid('Select an organization'),
  role: z.string().min(1, 'Select a role'),
  mfaEnabled: z.boolean().default(false),
  sendInvite: z.boolean().default(true)
});
export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  fullName: z.string().trim().min(2).max(200).optional(),
  fullNameAm: z.string().trim().max(200).optional().nullable(),
  email: z.string().trim().email().optional(),
  phone: z.string().regex(phoneRegex).optional().nullable().or(z.literal('')),
  orgId: z.string().uuid().optional(),
  role: z.string().min(1).optional(),
  status: z.nativeEnum(UserStatus).optional(),
  mfaEnabled: z.boolean().optional()
});
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

/* ─── Master data ────────────────────────────────────────────────── */

export const listMasterDataQuerySchema = z.object({
  category: z.string().optional(),
  q: z.string().optional(),
  active: z.coerce.boolean().optional(),
  limit: z.coerce.number().int().min(1).max(500).optional()
});
export type ListMasterDataQuery = z.infer<typeof listMasterDataQuerySchema>;

export const createMasterDataSchema = z.object({
  category: z.string().trim().min(1).max(50),
  code: z.string().trim().min(1).max(30),
  name: z.string().trim().min(1).max(200),
  nameAm: z.string().trim().max(200).optional().or(z.literal('')),
  parentId: z.string().uuid().optional().or(z.literal('')),
  attributes: z.record(z.unknown()).optional(),
  orderNo: z.number().int().min(0).optional(),
  active: z.boolean().default(true)
});
export type CreateMasterDataInput = z.infer<typeof createMasterDataSchema>;

export const updateMasterDataSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  nameAm: z.string().trim().max(200).optional().nullable(),
  parentId: z.string().uuid().optional().nullable().or(z.literal('')),
  attributes: z.record(z.unknown()).optional(),
  orderNo: z.number().int().min(0).optional(),
  active: z.boolean().optional()
});
export type UpdateMasterDataInput = z.infer<typeof updateMasterDataSchema>;

/* ─── Audit log ──────────────────────────────────────────────────── */

export const listAuditQuerySchema = z.object({
  user_id: z.string().uuid().optional(),
  entity: z.string().optional(),
  entity_id: z.string().uuid().optional(),
  action: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  q: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(500).optional()
});
export type ListAuditQuery = z.infer<typeof listAuditQuerySchema>;