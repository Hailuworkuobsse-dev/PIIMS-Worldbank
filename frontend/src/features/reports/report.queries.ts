import { useQuery } from "@tanstack/react-query";
import { reportApi } from "./report.api";

export const reportKeys = {
  all: ["reports"] as const,
  catalogue: () => [...reportKeys.all, "catalogue"] as const,
  instances: () => [...reportKeys.all, "instances"] as const,
  instance: (id: string) => [...reportKeys.all, "instance", id] as const,
  schedules: () => [...reportKeys.all, "schedules"] as const,
};

export function useReportCatalogue() {
  return useQuery({
    queryKey: reportKeys.catalogue(),
    queryFn: () => reportApi.catalogue(),
    staleTime: 5 * 60_000,
  });
}

export function useReportInstances() {
  return useQuery({
    queryKey: reportKeys.instances(),
    queryFn: () => reportApi.instances(50),
    refetchInterval: (q) => {
      const data = q.state.data as any[] | undefined;
      const hasGenerating = data?.some(
        (r) => r.status === "GENERATING" || r.status === "QUEUED",
      );
      return hasGenerating ? 3000 : false;
    },
    staleTime: 10_000,
  });
}

export function useReportSchedules() {
  return useQuery({
    queryKey: reportKeys.schedules(),
    queryFn: () => reportApi.schedules(),
    staleTime: 60_000,
  });
}