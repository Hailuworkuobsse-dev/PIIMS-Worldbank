import { z } from 'zod';
import { SupplierCategory } from '@prisma/client';

const categoryValues = Object.values(SupplierCategory) as [SupplierCategory, ...SupplierCategory[]];

const phoneRegex = /^(\+251|0)[79]\d{8}$/;

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(200).optional(),
  nameAm: z.string().trim().max(200).optional().or(z.literal('')),
  tin: z.string().trim().min(5).max(20).optional().or(z.literal('')),
  licenseNo: z.string().trim().max(50).optional().or(z.literal('')),
  category: z.enum(categoryValues).optional(),
  contactPerson: z.string().trim().max(120).optional().or(z.literal('')),
  contactEmail: z.string().email().optional().or(z.literal('')),
  contactPhone: z.string().regex(phoneRegex).optional().or(z.literal('')),
  address: z.string().trim().max(300).optional().or(z.literal(''))
});
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const submitDeliverySchema = z.object({
  contractId: z.string().uuid('Select a contract'),
  productId: z.string().uuid().optional().or(z.literal('')),
  productName: z.string().trim().min(2, 'Product name required').max(200),
  beneficiaryId: z.string().uuid().optional().or(z.literal('')),
  serialNo: z.string().trim().min(3, 'Serial number required').max(80),
  quantity: z.coerce.number().int().min(1).max(1000),
  installDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD'),
  installGps: z.object({ lat: z.number(), lon: z.number() }).optional(),
  warrantyMonths: z.coerce.number().int().min(1).max(120).default(24)
});
export type SubmitDeliveryInput = z.infer<typeof submitDeliverySchema>;

export const uploadInvoiceSchema = z.object({
  contractId: z.string().uuid('Select a contract'),
  invoiceNo: z.string().trim().min(1).max(50),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Valid amount required'),
  currency: z.enum(['ETB', 'USD', 'EUR'])
});
export type UploadInvoiceInput = z.infer<typeof uploadInvoiceSchema>;