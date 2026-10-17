import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { beneficiaryApi } from "./beneficiary.api";
import type {
  BeneficiaryFilters,
  ServiceDeliveryFilters,
} from "./beneficiary.types";

export const beneficiaryKeys = {
  all: ["beneficiaries"] as const,
  list: (f: BeneficiaryFilters) => [...beneficiaryKeys.all, "list", f] as const,
  detail: (id: string) => [...beneficiaryKeys.all, "detail", id] as const,
  deliveries: (f: ServiceDeliveryFilters) =>
    [...beneficiaryKeys.all, "deliveries", f] as const,
  smsIntake: () => [...beneficiaryKeys.all, "sms-intake"] as const,
};

export function useBeneficiaries(f: BeneficiaryFilters) {
  return useQuery({
    queryKey: beneficiaryKeys.list(f),
    queryFn: () => beneficiaryApi.list(f),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

export function useBeneficiary(beneficiaryId: string | undefined) {
  return useQuery({
    queryKey: beneficiaryKeys.detail(beneficiaryId ?? ""),
    queryFn: () => beneficiaryApi.get(beneficiaryId!),
    enabled: !!beneficiaryId,
  });
}

export function useServiceDeliveries(f: ServiceDeliveryFilters) {
  return useQuery({
    queryKey: beneficiaryKeys.deliveries(f),
    queryFn: () => beneficiaryApi.listDeliveries(f),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

export function useSmsIntake() {
  return useQuery({
    queryKey: beneficiaryKeys.smsIntake(),
    queryFn: () => beneficiaryApi.smsIntake(),
    refetchInterval: 60_000,
  });
}