import {
  useQuery,
  keepPreviousData,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { projectApi } from "./project.api";
import type { ProjectFilters } from "./project.types";

export const projectKeys = {
  all: ["projects"] as const,
  list: (f: ProjectFilters) => [...projectKeys.all, "list", f] as const,
  infinite: (f: ProjectFilters) => [...projectKeys.all, "infinite", f] as const,
  detail: (id: string) => [...projectKeys.all, "detail", id] as const,
  history: (id: string) => [...projectKeys.all, "history", id] as const,
  pipeline: () => [...projectKeys.all, "pipeline"] as const,
};

export function useProjects(filters: ProjectFilters) {
  return useQuery({
    queryKey: projectKeys.list(filters),
    queryFn: () => projectApi.list(filters),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

export function useProjectsInfinite(filters: ProjectFilters) {
  return useInfiniteQuery({
    queryKey: projectKeys.infinite(filters),
    queryFn: ({ pageParam }) =>
      projectApi.list({ ...filters, cursor: pageParam as string | undefined }),
    getNextPageParam: (last) =>
      last.pagination.hasMore ? last.pagination.nextCursor : undefined,
    initialPageParam: undefined as string | undefined,
    staleTime: 30_000,
  });
}

export function useProject(projectId: string | undefined) {
  return useQuery({
    queryKey: projectKeys.detail(projectId ?? ""),
    queryFn: () => projectApi.get(projectId!),
    enabled: !!projectId,
    staleTime: 60_000,
  });
}

export function useProjectHistory(projectId: string | undefined) {
  return useQuery({
    queryKey: projectKeys.history(projectId ?? ""),
    queryFn: () => projectApi.history(projectId!),
    enabled: !!projectId,
  });
}

export function usePipeline() {
  return useQuery({
    queryKey: projectKeys.pipeline(),
    queryFn: () => projectApi.pipeline(),
    staleTime: 60_000,
  });
}