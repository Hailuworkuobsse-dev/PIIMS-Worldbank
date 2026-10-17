// field.queries.ts
import { useQuery } from "@tanstack/react-query";
import { fieldApi } from "./field.api";

export const fieldKeys = {
  all: ["field"] as const,
  me: () => [...fieldKeys.all, "me"] as const,
  assignments: () => [...fieldKeys.all, "assignments"] as const,
  survey: (id: string) => [...fieldKeys.all, "survey", id] as const,
};

export function useCollectorProfile() {
  return useQuery({
    queryKey: fieldKeys.me(),
    queryFn: () => fieldApi.me(),
    staleTime: 5 * 60_000,
  });
}

export function useAssignments() {
  return useQuery({
    queryKey: fieldKeys.assignments(),
    queryFn: () => fieldApi.assignments(),
    staleTime: 60_000,
  });
}

export function useSurveyView(assignmentId: string | undefined) {
  return useQuery({
    queryKey: fieldKeys.survey(assignmentId ?? ""),
    queryFn: () => fieldApi.surveyView(assignmentId!),
    enabled: !!assignmentId,
    staleTime: 10 * 60_000,
  });
}