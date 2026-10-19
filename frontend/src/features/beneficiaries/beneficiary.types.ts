export const GENDERS = ["MALE", "FEMALE", "OTHER"] as const;
export type Gender = (typeof GENDERS)[number];

export const REGISTRATION_CHANNELS = [
  "WEB",
  "SMS",
  "USSD",
  "CAPI",
  "IMPORT",
  "SUPPLIER",
] as const;
export type RegistrationChannel = (typeof REGISTRATION_CHANNELS)[number];

export const BENEFICIARY_STATUSES = [
  "REGISTERED",
  "VERIFIED",
  "ACTIVE",
  "INACTIVE",
  "DUPLICATE",
] as const;
export type BeneficiaryStatus = (typeof BENEFICIARY_STATUSES)[number];

export const DELIVERY_STATUSES = [
  "PLANNED",
  "DELIVERED",
  "INSTALLED",
  "VERIFIED",
  "FAILED",
] as const;
export type DeliveryStatus = (typeof DELIVERY_STATUSES)[number];

export interface ConsentFlags {
  participation: boolean;
  data_use: boolean;
  future_research: boolean;
  media: boolean;
  contact: boolean;
  consent_version: string;
  language: "en" | "am";
}

export interface BeneficiaryLocation {
  locationId?: string;
  region: string;
  zone?: string;
  woreda?: string;
  kebele?: string;
  latitude?: number;
  longitude?: number;
}

export interface Beneficiary {
  beneficiaryId: string;
  uniqueId: string;
  nationalId?: string;
  fullName: string;
  fullNameAm?: string;
  gender: Gender;
  dateOfBirth?: string;
  ageYears?: number;
  householdSize?: number;
  phone?: string;
  location: BeneficiaryLocation;
  registrationChannel: RegistrationChannel;
  registrationDate: string;
  status: BeneficiaryStatus;
  verifiedBy?: string;
  verifiedByName?: string;
  verifiedAt?: string;
  dedupScore?: number;
  vulnerability?: Record<string, boolean>;
}

export interface DuplicateCandidate {
  candidateId: string;
  fullName: string;
  uniqueId: string;
  region: string;
  woreda: string;
  phone?: string;
  dedupScore: number;
  matchReasons: string[];
}

export interface ServiceDelivery {
  deliveryId: string;
  beneficiaryId: string;
  beneficiaryName: string;
  beneficiaryUniqueId: string;
  projectId: string;
  projectCode: string;
  supplierId?: string | undefined;
  supplierName?: string | undefined;
  productId?: string | undefined;
  productName: string;
  serialNo?: string | undefined;
  quantity: number;
  installDate?: string | undefined;
  installGps?: { lat: number; lon: number };
  installPhotoUrl?: string | undefined;
  warrantyStart?: string | undefined;
  warrantyEnd?: string | undefined;
  status: DeliveryStatus;
  verifiedBy?: string | undefined;
  verifiedAt?: string | undefined;
  createdAt: string;
}

export interface BeneficiaryFilters {
  q?: string | undefined;
  region?: string | undefined;
  woreda?: string | undefined;
  status?: BeneficiaryStatus[] | undefined;
  gender?: Gender[] | undefined;
  registeredFrom?: string | undefined;
  registeredTo?: string | undefined;
  limit?: number | undefined;
  cursor?: string | undefined;
}

export interface ServiceDeliveryFilters {
  projectId?: string | undefined;
  supplierId?: string | undefined;
  status?: DeliveryStatus[] | undefined;
  q?: string | undefined;
  limit?: number | undefined;
  cursor?: string | undefined;
}