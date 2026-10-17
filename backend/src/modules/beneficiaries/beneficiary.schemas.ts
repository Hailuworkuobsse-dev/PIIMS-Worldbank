import { z } from 'zod';
import { Gender, RegistrationChannel, DeliveryStatus } from '@prisma/client';

const genderValues = Object.values(Gender) as [Gender, ...Gender[]];
const channelValues = Object.values(RegistrationChannel) as [RegistrationChannel, ...RegistrationChannel[]];
const deliveryStatusValues = Object.values(DeliveryStatus) as [DeliveryStatus, ...DeliveryStatus[]];

const phoneRegex = /^(\+251|0)[79]\d{8}$/;

const locationSchema = z.object({
  region: z.string().trim().min(1, 'Region is required').max(100),
  zone: z.string().trim().max(100).optional().or(z.literal('')),
  woreda: z.string().trim().max(100).optional().or(z.literal('')),
  kebele: z.string().trim().max(100).optional().or(z.literal('')),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional()
});

const consentSchema = z.object({
  participation: z.boolean(),
  data_use: z.boolean(),
  future_research: z.boolean().default(false),
  media: z.boolean().default(false),
  contact: z.boolean().default(false),
  consent_version: z.string().min(1),
  language: z.enum(['en', 'am']).default('en')
});

export const registerBeneficiarySchema = z.object({
  fullName: z.string().trim().min(2).max(200),
  fullNameAm: z.string().trim().max(200).optional().or(z.literal('')),
  gender: z.enum(genderValues),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')),
  ageYears: z.coerce.number().int().min(0).max(120).optional(),
  householdSize: z.coerce.number().int().min(1).max(30).optional(),
  phone: z.string().regex(phoneRegex).optional().or(z.literal('')),
  nationalId: z.string().trim().max(50).optional().or(z.literal('')),
  location: locationSchema,
  registrationChannel: z.enum(channelValues).default(Gender ? 'WEB' : 'WEB'),
  consent: consentSchema,
  force_create: z.boolean().default(false)
}).refine(
  (d) => d.consent.participation && d.consent.data_use,
  { path: ['consent'], message: 'Participation and data use consent are required' }
);
export type RegisterBeneficiaryInput = z.infer<typeof registerBeneficiarySchema>;

export const dedupCheckSchema = z.object({
  fullName: z.string().trim().min(2).max(200),
  gender: z.enum(genderValues),
  phone: z.string().regex(phoneRegex).optional().or(z.literal('')),
  nationalId: z.string().trim().max(50).optional().or(z.literal('')),
  location: locationSchema
});
export type DedupCheckInput = z.infer<typeof dedupCheckSchema>;

export const listBeneficiariesQuerySchema = z.object({
  q: z.string().optional(),
  region: z.string().optional(),
  woreda: z.string().optional(),
  status: z.string().optional(),
  gender: z.string().optional(),
  registered_from: z.string().optional(),
  registered_to: z.string().optional(),
  sms_intake: z.coerce.boolean().optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  cursor: z.string().optional()
});
export type ListBeneficiariesQuery = z.infer<typeof listBeneficiariesQuerySchema>;

export const verifyBeneficiarySchema = z.object({
  verified: z.boolean(),
  notes: z.string().max(500).optional().or(z.literal(''))
});
export type VerifyBeneficiaryInput = z.infer<typeof verifyBeneficiarySchema>;

export const mergeBeneficiarySchema = z.object({
  duplicate_id: z.string().uuid()
});
export type MergeBeneficiaryInput = z.infer<typeof mergeBeneficiarySchema>;

export const createDeliverySchema = z.object({
  beneficiaryId: z.string().uuid('Select a beneficiary'),
  projectId: z.string().uuid('Select a project'),
  supplierId: z.string().uuid().optional().or(z.literal('')),
  productId: z.string().uuid().optional().or(z.literal('')),
  productName: z.string().trim().min(2).max(200),
  serialNo: z.string().trim().max(80).optional().or(z.literal('')),
  quantity: z.coerce.number().int().min(1).max(1000),
  installDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')),
  installGps: z.object({ lat: z.number(), lon: z.number() }).optional(),
  warrantyStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')),
  warrantyEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')),
  status: z.enum(deliveryStatusValues).default('PLANNED')
}).refine(
  (d) => !d.warrantyStart || !d.warrantyEnd || new Date(d.warrantyEnd) > new Date(d.warrantyStart),
  { path: ['warrantyEnd'], message: 'Warranty end must be after start' }
);
export type CreateDeliveryInput = z.infer<typeof createDeliverySchema>;

export const listDeliveriesQuerySchema = z.object({
  project_id: z.string().uuid().optional(),
  supplier_id: z.string().uuid().optional(),
  status: z.string().optional(),
  q: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  cursor: z.string().optional()
});
export type ListDeliveriesQuery = z.infer<typeof listDeliveriesQuerySchema>;

export const verifyDeliverySchema = z.object({
  verified: z.boolean()
});
export type VerifyDeliveryInput = z.infer<typeof verifyDeliverySchema>;