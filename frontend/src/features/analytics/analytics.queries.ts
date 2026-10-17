// analytics.queries.ts
import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "./analytics.api";

export const analyticsKeys = {
  all: ["analytics"] as const,
  dashboard: (projectId: string) =>
    [...analyticsKeys.all, "dashboard", projectId] as const,
  did: (projectId: string, indicatorId: string) =>
    [...analyticsKeys.all, "did", projectId, indicatorId] as const,
};

export function useImpactDashboard(projectId: string | undefined) {
  return useQuery({
    queryKey: analyticsKeys.dashboard(projectId ?? ""),
    queryFn: () => analyticsApi.dashboard(projectId!),
    enabled: !!projectId,
    staleTime: 60_000,
  });
}

export function useDiD(
  projectId: string | undefined,
  indicatorId: string | undefined,
  tg: string,
  cg: string,
) {
  return useQuery({
    queryKey: analyticsKeys.did(projectId ?? "", indicatorId ?? ""),
    queryFn: () => analyticsApi.did(projectId!, indicatorId!, tg, cg),
    enabled: !!projectId && !!indicatorId,
  });
}