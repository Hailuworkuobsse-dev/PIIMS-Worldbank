import { z } from "zod";
import { GENDERS, REGISTRATION_CHANNELS } from "./beneficiary.types";

/* Ethiopian phone: +251 followed by 9 digits, or 0 followed by 9 digits */
const phoneRegex = /^(\+251|0)[79]\d{8}$/;

export const beneficiarySchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required").max(200),
  fullNameAm: z.string().trim().max(200).optional().or(z.literal("")),
  gender: z.enum(GENDERS),
  dateOfBirth: z.string().optional().or(z.literal("")),
  ageYears: z.number().int().min(0).max(120).optional(),
  householdSize: z.number().int().min(1).max(30).optional(),
  phone: z
    .string()
    .regex(phoneRegex, "Enter a valid Ethiopian phone (+251… or 0…)")
    .optional()
    .or(z.literal("")),
  nationalId: z.string().trim().max(50).optional().or(z.literal("")),
  location: z.object({
    region: z.string().min(1, "Region is required"),
    zone: z.string().optional().or(z.literal("")),
    woreda: z.string().optional().or(z.literal("")),
    kebele: z.string().optional().or(z.literal("")),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
  }),
  registrationChannel: z.enum(REGISTRATION_CHANNELS).default("WEB"),
  vulnerability: z.record(z.boolean()).optional(),
});
export type BeneficiaryFormData = z.infer<typeof beneficiarySchema>;

export const consentSchema = z.object({
  participation: z.literal(true, {
    errorMap: () => ({ message: "Participation consent is required" }),
  }),
  data_use: z.literal(true, {
    errorMap: () => ({ message: "Data use consent is required" }),
  }),
  future_research: z.boolean().default(false),
  media: z.boolean().default(false),
  contact: z.boolean().default(false),
  consent_version: z.string(),
  language: z.enum(["en", "am"]),
});
export type ConsentFormData = z.infer<typeof consentSchema>;

export const beneficiaryWithConsentSchema = beneficiarySchema.extend({
  consent: consentSchema,
});
export type BeneficiaryWithConsentFormData = z.infer<
  typeof beneficiaryWithConsentSchema
>;

export const serviceDeliverySchema = z
  .object({
    beneficiaryId: z.string().uuid("Select a beneficiary"),
    projectId: z.string().uuid("Select a project"),
    supplierId: z.string().uuid().optional().or(z.literal("")),
    productId: z.string().uuid().optional().or(z.literal("")),
    productName: z.string().trim().min(2, "Product name is required").max(200),
    serialNo: z.string().trim().max(80).optional().or(z.literal("")),
    quantity: z.number().int().min(1).max(1000),
    installDate: z.string().optional().or(z.literal("")),
    installGps: z.object({ lat: z.number(), lon: z.number() }).optional(),
    warrantyStart: z.string().optional().or(z.literal("")),
    warrantyEnd: z.string().optional().or(z.literal("")),
  })
  .refine(
    (d) =>
      !d.warrantyStart ||
      !d.warrantyEnd ||
      Date.parse(d.warrantyEnd) > Date.parse(d.warrantyStart),
    { path: ["warrantyEnd"], message: "Warranty end must be after start" },
  );
export type ServiceDeliveryFormData = z.infer<typeof serviceDeliverySchema>;

export const beneficiaryFiltersSchema = z.object({
  q: z.string().optional(),
  region: z.string().optional(),
  woreda: z.string().optional(),
  status: z.array(z.string()).optional(),
  gender: z.array(z.string()).optional(),
});