import { z } from "zod";

export const supplierProfileSchema = z.object({
  name: z.string().trim().min(2).max(200),
  nameAm: z.string().trim().max(200).optional().or(z.literal("")),
  tin: z.string().trim().min(5, "TIN is required").max(20),
  licenseNo: z.string().trim().min(1).max(50),
  category: z.enum([
    "MANUFACTURER",
    "IMPORTER",
    "INSTALLER",
    "DISTRIBUTOR",
    "OTHER",
  ]),
  contactPerson: z.string().trim().min(2).max(120),
  contactEmail: z.string().email("Enter a valid email"),
  contactPhone: z.string().trim().min(7).max(20),
  address: z.string().trim().min(5).max(300),
});
export type SupplierProfileFormData = z.infer<typeof supplierProfileSchema>;

export const deliveryFormSchema = z.object({
  contractId: z.string().uuid("Select a contract"),
  productId: z.string().uuid().optional().or(z.literal("")),
  productName: z.string().trim().min(2, "Product name required").max(200),
  beneficiaryId: z.string().uuid().optional().or(z.literal("")),
  serialNo: z.string().trim().min(3, "Serial number required").max(80),
  quantity: z.number().int().min(1).max(1000),
  installDate: z.string().min(1, "Install date is required"),
  installGps: z.object({ lat: z.number(), lon: z.number() }).optional(),
  warrantyMonths: z.number().int().min(1).max(120).default(24),
});
export type DeliveryFormData = z.infer<typeof deliveryFormSchema>;

export const invoiceUploadSchema = z.object({
  contractId: z.string().uuid(),
  invoiceNo: z.string().trim().min(1, "Invoice number required").max(50),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Must be a valid amount"),
  currency: z.enum(["ETB", "USD", "EUR"]),
});
export type InvoiceUploadFormData = z.infer<typeof invoiceUploadSchema>;