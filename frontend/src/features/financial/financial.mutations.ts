import { useMutation, useQueryClient } from "@tanstack/react-query";
import { financialApi } from "./financial.api";
import { financialKeys } from "./financial.queries";
import { projectKeys } from "@/features/projects/project.queries";
import { useToast } from "@/components/ui/Toast";
import { normalizeApiError } from "@/lib/api/errors";
import type { BudgetFormData, DisbursementFormData } from "./financial.schema";

export function useCreateBudget() {
  const qc = useQueryClient();
  const { push } = useToast();
  return useMutation({
    mutationFn: (input: BudgetFormData) => financialApi.createBudget(input),
    onSuccess: (b) => {
      qc.invalidateQueries({ queryKey: financialKeys.all });
      qc.invalidateQueries({ queryKey: projectKeys.detail(b.projectId) });
      push("success", "Budget recorded");
    },
    onError: (err) =>
      push("error", normalizeApiError(err).detail ?? "Failed to record budget"),
  });
}

export function useCreateDisbursement() {
  const qc = useQueryClient();
  const { push } = useToast();
  return useMutation({
    mutationFn: (input: DisbursementFormData) =>
      financialApi.createDisbursement(input),
    onSuccess: (d) => {
      qc.invalidateQueries({ queryKey: financialKeys.all });
      qc.invalidateQueries({ queryKey: projectKeys.detail(d.projectId) });
      push(
        "success",
        `Disbursement recorded · ${d.currency} ${Number(d.amount).toLocaleString()}`,
      );
    },
    onError: (err) =>
      push(
        "error",
        normalizeApiError(err).detail ?? "Failed to record disbursement",
      ),
  });
}

export function useTriggerFmisSync() {
  const qc = useQueryClient();
  const { push } = useToast();
  return useMutation({
    mutationFn: (kind: "APPROPRIATION" | "RELEASE" | "EXPENDITURE") =>
      financialApi.triggerFmisSync(kind),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: financialKeys.fmisRuns() });
      push("info", "FMIS sync job queued");
    },
    onError: (err) =>
      push("error", normalizeApiError(err).detail ?? "Sync trigger failed"),
  });
}