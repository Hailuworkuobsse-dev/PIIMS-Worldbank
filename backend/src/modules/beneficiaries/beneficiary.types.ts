import type {
  Gender, RegistrationChannel, BeneficiaryStatus, DeliveryStatus
} from '@prisma/client';

export interface BeneficiaryLocationDTO {
  locationId?: string;
  region: string;
  zone?: string;
  woreda?: string;
  kebele?: string;
  latitude?: number;
  longitude?: number;
}

export interface BeneficiaryDTO {
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
  location: BeneficiaryLocationDTO;
  registrationChannel: RegistrationChannel;
  registrationDate: string;
  status: BeneficiaryStatus;
  verifiedById?: string;
  verifiedByName?: string;
  verifiedAt?: string;
  dedupScore?: number;
  vulnerability?: Record<string, boolean>;
}

export interface DuplicateCandidateDTO {
  candidateId: string;
  fullName: string;
  uniqueId: string;
  region: string;
  woreda: string;
  phone?: string;
  dedupScore: number;
  matchReasons: string[];
}

export interface ServiceDeliveryDTO {
  deliveryId: string;
  beneficiaryId: string;
  beneficiaryName: string;
  beneficiaryUniqueId: string;
  projectId: string;
  projectCode: string;
  supplierId?: string;
  supplierName?: string;
  productId?: string;
  productName: string;
  serialNo?: string;
  quantity: number;
  installDate?: string;
  installGps?: { lat: number; lon: number };
  installPhotoUrl?: string;
  warrantyStart?: string;
  warrantyEnd?: string;
  status: DeliveryStatus;
  verifiedById?: string;
  verifiedAt?: string;
  createdAt: string;
}