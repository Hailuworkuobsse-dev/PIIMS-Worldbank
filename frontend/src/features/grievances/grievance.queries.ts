import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { grievanceApi } from "./grievance.api";
import type { GrievanceFilters } from "./grievance.types";

export const grievanceKeys = {
  all: ["grievances"] as const,
  list: (f: GrievanceFilters) => [...grievanceKeys.all, "list", f] as const,
  detail: (id: string) => [...grievanceKeys.all, "detail", id] as const,
  actions: (id: string) => [...grievanceKeys.all, "actions", id] as const,
  stats: (projectId?: string) =>
    [...grievanceKeys.all, "stats", projectId ?? "all"] as const,
};

export function useGrievances(f: GrievanceFilters) {
  return useQuery({
    queryKey: grievanceKeys.list(f),
    queryFn: () => grievanceApi.list(f),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

export function useGrievance(grievanceId: string | undefined) {
  return useQuery({
    queryKey: grievanceKeys.detail(grievanceId ?? ""),
    queryFn: () => grievanceApi.get(grievanceId!),
    enabled: !!grievanceId,
  });
}

export function useGrievanceActions(grievanceId: string | undefined) {
  return useQuery({
    queryKey: grievanceKeys.actions(grievanceId ?? ""),
    queryFn: () => grievanceApi.actions(grievanceId!),
    enabled: !!grievanceId,
  });
}

export function useGrievanceStats(projectId?: string) {
  return useQuery({
    queryKey: grievanceKeys.stats(projectId),
    queryFn: () => grievanceApi.stats(projectId),
    staleTime: 60_000,
  });
}