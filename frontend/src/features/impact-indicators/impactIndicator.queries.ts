import { useQuery } from "@tanstack/react-query";
import { impactIndicatorApi } from "./impactIndicator.api";
import type { ImpactIndicatorFilters } from "./impactIndicator.types";

export const impactIndicatorKeys = {
  all: ["impact-indicators"] as const,
  list: (f: ImpactIndicatorFilters) =>
    [...impactIndicatorKeys.all, "list", f] as const,
  detail: (id: string) => [...impactIndicatorKeys.all, "detail", id] as const,
  toc: (projectId: string) =>
    [...impactIndicatorKeys.all, "toc", projectId] as const,
  library: () => [...impactIndicatorKeys.all, "library"] as const,
};

export function useImpactIndicators(f: ImpactIndicatorFilters) {
  return useQuery({
    queryKey: impactIndicatorKeys.list(f),
    queryFn: () => impactIndicatorApi.list(f),
    staleTime: 60_000,
  });
}

export function useImpactIndicator(id: string | undefined) {
  return useQuery({
    queryKey: impactIndicatorKeys.detail(id ?? ""),
    queryFn: () => impactIndicatorApi.get(id!),
    enabled: !!id,
  });
}

export function useTheoryOfChange(projectId: string | undefined) {
  return useQuery({
    queryKey: impactIndicatorKeys.toc(projectId ?? ""),
    queryFn: () => impactIndicatorApi.theoryOfChange(projectId!),
    enabled: !!projectId,
  });
}

export function useStandardLibrary() {
  return useQuery({
    queryKey: impactIndicatorKeys.library(),
    queryFn: () => impactIndicatorApi.standardLibrary(),
    staleTime: 5 * 60_000,
  });
}