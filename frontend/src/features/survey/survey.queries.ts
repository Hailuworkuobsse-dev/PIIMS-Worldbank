// survey.queries.ts
import { useQuery } from "@tanstack/react-query";
import { surveyApi } from "./survey.api";
import type { SurveyFilters } from "./survey.types";

export const surveyKeys = {
  all: ["surveys"] as const,
  list: (f: SurveyFilters) => [...surveyKeys.all, "list", f] as const,
  detail: (id: string) => [...surveyKeys.all, "detail", id] as const,
};

export function useSurveys(f: SurveyFilters) {
  return useQuery({
    queryKey: surveyKeys.list(f),
    queryFn: () => surveyApi.list(f),
    staleTime: 60_000,
  });
}

export function useSurvey(id: string | undefined) {
  return useQuery({
    queryKey: surveyKeys.detail(id ?? ""),
    queryFn: () => surveyApi.get(id!),
    enabled: !!id,
  });
}