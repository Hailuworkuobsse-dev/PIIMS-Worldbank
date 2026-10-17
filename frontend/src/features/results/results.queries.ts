import { useQuery } from "@tanstack/react-query";
import { resultsApi } from "./results.api";
import type { ResultsFilters } from "./results.types";

export const resultsKeys = {
  all: ["results"] as const,
  components: (projectId: string) =>
    [...resultsKeys.all, "components", projectId] as const,
  subcomponents: (componentId: string) =>
    [...resultsKeys.all, "subcomponents", componentId] as const,
  indicators: (f: ResultsFilters) =>
    [...resultsKeys.all, "indicators", f] as const,
  indicator: (id: string) => [...resultsKeys.all, "indicator", id] as const,
  values: (indicatorId: string) =>
    [...resultsKeys.all, "values", indicatorId] as const,
  aggregation: (projectId: string, groupBy: string) =>
    [...resultsKeys.all, "agg", projectId, groupBy] as const,
};

export function useComponents(projectId: string | undefined) {
  return useQuery({
    queryKey: resultsKeys.components(projectId ?? ""),
    queryFn: () => resultsApi.listComponents(projectId!),
    enabled: !!projectId,
  });
}

export function useSubcomponents(componentId: string | undefined) {
  return useQuery({
    queryKey: resultsKeys.subcomponents(componentId ?? ""),
    queryFn: () => resultsApi.listSubcomponents(componentId!),
    enabled: !!componentId,
  });
}

export function useIndicators(f: ResultsFilters) {
  return useQuery({
    queryKey: resultsKeys.indicators(f),
    queryFn: () => resultsApi.listIndicators(f),
    enabled: !!f.projectId,
  });
}

export function useIndicator(indicatorId: string | undefined) {
  return useQuery({
    queryKey: resultsKeys.indicator(indicatorId ?? ""),
    queryFn: () => resultsApi.getIndicator(indicatorId!),
    enabled: !!indicatorId,
  });
}

export function useIndicatorValues(indicatorId: string | undefined) {
  return useQuery({
    queryKey: resultsKeys.values(indicatorId ?? ""),
    queryFn: () => resultsApi.listValues(indicatorId!),
    enabled: !!indicatorId,
  });
}

export function useAggregation(
  projectId: string | undefined,
  groupBy: "component" | "region" | "gender",
) {
  return useQuery({
    queryKey: resultsKeys.aggregation(projectId ?? "", groupBy),
    queryFn: () => resultsApi.aggregation(projectId!, groupBy),
    enabled: !!projectId,
  });
}