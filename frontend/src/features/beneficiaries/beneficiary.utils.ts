import type { ChipTone } from "@/components/ui/Chip";
import type { BeneficiaryStatus, DeliveryStatus } from "./beneficiary.types";

export function beneficiaryStatusTone(s: BeneficiaryStatus): ChipTone {
  switch (s) {
    case "REGISTERED":
      return "blue";
    case "VERIFIED":
      return "green";
    case "ACTIVE":
      return "green";
    case "INACTIVE":
      return "grey";
    case "DUPLICATE":
      return "red";
  }
}

export function beneficiaryStatusKey(s: BeneficiaryStatus): string {
  return `beneficiaries.status.${s.toLowerCase()}`;
}

export function deliveryStatusTone(s: DeliveryStatus): ChipTone {
  switch (s) {
    case "PLANNED":
      return "grey";
    case "DELIVERED":
      return "blue";
    case "INSTALLED":
      return "blue";
    case "VERIFIED":
      return "green";
    case "FAILED":
      return "red";
  }
}

export function deliveryStatusKey(s: DeliveryStatus): string {
  return `beneficiaries.delivery.status.${s.toLowerCase()}`;
}

export function dedupTone(score: number): ChipTone {
  if (score >= 0.9) return "red";
  if (score >= 0.7) return "amber";
  return "grey";
}

/** Very light client-side masking helper for displaying phone numbers. */
export function maskPhone(phone?: string): string {
  if (!phone) return "—";
  if (phone.length < 6) return phone;
  return `${phone.slice(0, 4)} **** ${phone.slice(-2)}`;
}

export const ETHIOPIAN_REGIONS = [
  "Addis Ababa",
  "Afar",
  "Amhara",
  "Benishangul-Gumuz",
  "Dire Dawa",
  "Gambella",
  "Harari",
  "Oromia",
  "Sidama",
  "SNNP",
  "Somali",
  "South West Ethiopia",
  "Tigray",
];