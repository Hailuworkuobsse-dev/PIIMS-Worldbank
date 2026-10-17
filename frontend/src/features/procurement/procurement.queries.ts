import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { procurementApi } from "./procurement.api";
import type { ProcurementFilters, ContractFilters } from "./procurement.types";

export const procurementKeys = {
  all: ["procurement"] as const,
  list: (f: ProcurementFilters) => [...procurementKeys.all, "list", f] as const,
  delays: (projectId?: string) =>
    [...procurementKeys.all, "delays", projectId ?? "all"] as const,
  contracts: (f: ContractFilters) =>
    [...procurementKeys.all, "contracts", f] as const,
  supplierPerf: (id: string) =>
    [...procurementKeys.all, "supplier-perf", id] as const,
};

export function useProcurement(f: ProcurementFilters) {
  return useQuery({
    queryKey: procurementKeys.list(f),
    queryFn: () => procurementApi.list(f),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

export function useProcurementDelays(projectId?: string) {
  return useQuery({
    queryKey: procurementKeys.delays(projectId),
    queryFn: () => procurementApi.delays(projectId),
    refetchInterval: 60_000,
  });
}

export function useContracts(f: ContractFilters) {
  return useQuery({
    queryKey: procurementKeys.contracts(f),
    queryFn: () => procurementApi.contracts(f),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

export function useSupplierPerformance(supplierId: string | undefined) {
  return useQuery({
    queryKey: procurementKeys.supplierPerf(supplierId ?? ""),
    queryFn: () => procurementApi.supplierPerformance(supplierId!),
    enabled: !!supplierId,
  });
}