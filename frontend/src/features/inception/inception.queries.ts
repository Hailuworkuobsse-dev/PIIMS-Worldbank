import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { inceptionApi } from "./inception.api";
import type { InceptionReportListFilters } from "./inception.types";

export const inceptionKeys = {
  all: ["inception"] as const,
  list: (f: InceptionReportListFilters) =>
    [...inceptionKeys.all, "list", f] as const,
  detail: (id: string) => [...inceptionKeys.all, "detail", id] as const,
  comments: (id: string) => [...inceptionKeys.all, "comments", id] as const,
  templates: () => [...inceptionKeys.all, "templates"] as const,
  versions: (projectId: string) =>
    [...inceptionKeys.all, "versions", projectId] as const,
};

export function useInceptionReports(filters: InceptionReportListFilters) {
  return useQuery({
    queryKey: inceptionKeys.list(filters),
    queryFn: () => inceptionApi.list(filters),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

export function useInceptionReport(reportId: string | undefined) {
  return useQuery({
    queryKey: inceptionKeys.detail(reportId ?? ""),
    queryFn: () => inceptionApi.get(reportId!),
    enabled: !!reportId,
  });
}

export function useInceptionTemplates() {
  return useQuery({
    queryKey: inceptionKeys.templates(),
    queryFn: () => inceptionApi.templates(),
    staleTime: 5 * 60_000,
  });
}

export function useReportComments(reportId: string | undefined) {
  return useQuery({
    queryKey: inceptionKeys.comments(reportId ?? ""),
    queryFn: () => inceptionApi.comments(reportId!),
    enabled: !!reportId,
    refetchInterval: 30_000,
  });
}

export function useReportVersions(projectId: string | undefined) {
  return useQuery({
    queryKey: inceptionKeys.versions(projectId ?? ""),
    queryFn: () => inceptionApi.versions(projectId!),
    enabled: !!projectId,
  });
}