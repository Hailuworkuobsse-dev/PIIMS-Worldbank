import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { financialApi } from "./financial.api";
import type { BudgetFilters, DisbursementFilters } from "./financial.types";

export const financialKeys = {
  all: ["financial"] as const,
  budgets: (f: BudgetFilters) => [...financialKeys.all, "budgets", f] as const,
  execution: (projectId: string, fy?: number) =>
    [...financialKeys.all, "execution", projectId, fy] as const,
  disbursements: (f: DisbursementFilters) =>
    [...financialKeys.all, "disbursements", f] as const,
  fmisRuns: () => [...financialKeys.all, "fmis-runs"] as const,
  costPerOutput: (projectId: string) =>
    [...financialKeys.all, "cost-per-output", projectId] as const,
  exceptions: (projectId?: string) =>
    [...financialKeys.all, "exceptions", projectId ?? "all"] as const,
};

export function useBudgets(f: BudgetFilters) {
  return useQuery({
    queryKey: financialKeys.budgets(f),
    queryFn: () => financialApi.listBudgets(f),
    enabled: !!f.projectId,
    staleTime: 60_000,
  });
}

export function useExecution(
  projectId: string | undefined,
  fiscalYear?: number,
) {
  return useQuery({
    queryKey: financialKeys.execution(projectId ?? "", fiscalYear),
    queryFn: () => financialApi.execution(projectId!, fiscalYear),
    enabled: !!projectId,
    staleTime: 60_000,
  });
}

export function useDisbursements(f: DisbursementFilters) {
  return useQuery({
    queryKey: financialKeys.disbursements(f),
    queryFn: () => financialApi.listDisbursements(f),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

export function useFmisRuns() {
  return useQuery({
    queryKey: financialKeys.fmisRuns(),
    queryFn: () => financialApi.fmisRuns(),
    refetchInterval: 15_000,
  });
}

export function useCostPerOutput(projectId: string | undefined) {
  return useQuery({
    queryKey: financialKeys.costPerOutput(projectId ?? ""),
    queryFn: () => financialApi.costPerOutput(projectId!),
    enabled: !!projectId,
  });
}

export function useFinancialExceptions(projectId?: string) {
  return useQuery({
    queryKey: financialKeys.exceptions(projectId),
    queryFn: () => financialApi.exceptions(projectId),
    refetchInterval: 60_000,
  });
}