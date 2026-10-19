import { useMutation, useQueryClient } from "@tanstack/react-query";
import { resultsApi } from "./results.api";
import { resultsKeys } from "./results.queries";
import { useToast } from "@/components/ui/Toast";
import { normalizeApiError } from "@/lib/api/errors";
import type {
  ComponentInput,
  SubComponentInput,
  IndicatorInput,
  IndicatorValueInput,
} from "./results.schema";

export function useCreateComponent(projectId: string) {
  const qc = useQueryClient();
  const { push } = useToast();
  return useMutation({
    mutationFn: (input: ComponentInput) =>
      resultsApi.createComponent(projectId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: resultsKeys.components(projectId) });
      push("success", "Component added");
    },
    onError: (err) =>
      push("error", normalizeApiError(err).detail ?? "Failed to add component"),
  });
}

export function useCreateSubcomponent(componentId: string) {
  const qc = useQueryClient();
  const { push } = useToast();
  return useMutation({
    mutationFn: (input: SubComponentInput) =>
      resultsApi.createSubcomponent(componentId, input),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: resultsKeys.subcomponents(componentId),
      });
      push("success", "Subcomponent added");
    },
    onError: (err) =>
      push(
        "error",
        normalizeApiError(err).detail ?? "Failed to add subcomponent",
      ),
  });
}

export function useCreateIndicator() {
  const qc = useQueryClient();
  const { push } = useToast();
  return useMutation({
    mutationFn: (input: IndicatorInput) => resultsApi.createIndicator(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: resultsKeys.all });
      qc.invalidateQueries({ queryKey: resultsKeys.components(projectId) });
      push("success", "Indicator added");
    },
    onError: (err) =>
      push("error", normalizeApiError(err).detail ?? "Failed to add indicator"),
  });
}

export function useRecordIndicatorValue(indicatorId: string) {
  const qc = useQueryClient();
  const { push } = useToast();
  return useMutation({
    mutationFn: (input: IndicatorValueInput) =>
      resultsApi.recordValue(indicatorId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: resultsKeys.values(indicatorId) });
      qc.invalidateQueries({ queryKey: resultsKeys.indicator(indicatorId) });
      qc.invalidateQueries({ queryKey: resultsKeys.all });
      push("success", "Value recorded");
    },
    onError: (err) =>
      push("error", normalizeApiError(err).detail ?? "Failed to record value"),
  });
}