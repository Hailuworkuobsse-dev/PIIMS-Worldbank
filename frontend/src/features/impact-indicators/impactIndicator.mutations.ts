import { useMutation, useQueryClient } from "@tanstack/react-query";
import { impactIndicatorApi } from "./impactIndicator.api";
import { impactIndicatorKeys } from "./impactIndicator.queries";
import { useToast } from "@/components/ui/Toast";
import { normalizeApiError } from "@/lib/api/errors";
import type {
  ImpactIndicatorFormData,
  CompositeFormData,
  WaveAssignmentFormData,
} from "./impactIndicator.schema";

export function useCreateImpactIndicator() {
  const qc = useQueryClient();
  const { push } = useToast();
  return useMutation({
    mutationFn: (input: ImpactIndicatorFormData) =>
      impactIndicatorApi.create(input),
    onSuccess: (i) => {
      qc.invalidateQueries({ queryKey: impactIndicatorKeys.all });
      push("success", `Indicator ${i.code} created`);
    },
    onError: (err) =>
      push(
        "error",
        normalizeApiError(err).detail ?? "Failed to create indicator",
      ),
  });
}

export function useAssignIndicatorWave() {
  const qc = useQueryClient();
  const { push } = useToast();
  return useMutation({
    mutationFn: (input: WaveAssignmentFormData) =>
      impactIndicatorApi.assignWave(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: impactIndicatorKeys.all });
      push("success", "Indicator assigned to wave");
    },
  });
}

export function useCreateComposite() {
  const qc = useQueryClient();
  const { push } = useToast();
  return useMutation({
    mutationFn: (input: CompositeFormData) =>
      impactIndicatorApi.createComposite(input),
    onSuccess: (i) => {
      qc.invalidateQueries({ queryKey: impactIndicatorKeys.all });
      push("success", `Composite index ${i.code} created`);
    },
  });
}