// qa.mutations.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { qaApi } from "./qa.api";
import { qaKeys } from "./qa.queries";
import { useToast } from "@/components/ui/Toast";
import { normalizeApiError } from "@/lib/api/errors";

export function useReviewFlag() {
  const qc = useQueryClient();
  const { push } = useToast();
  return useMutation({
    mutationFn: ({
      flagId,
      decision,
      notes,
    }: {
      flagId: string;
      decision: "ACCEPT" | "REJECT" | "BACK_CHECK";
      notes?: string;
    }) => qaApi.review(flagId, decision, notes),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qaKeys.all });
      push("success", "Review recorded");
    },
    onError: (err) =>
      push("error", normalizeApiError(err).detail ?? "Review failed"),
  });
}

export function useToggleRule() {
  const qc = useQueryClient();
  const { push } = useToast();
  return useMutation({
    mutationFn: ({ ruleId, active }: { ruleId: string; active: boolean }) =>
      qaApi.toggleRule(ruleId, active),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qaKeys.rules() });
      push("success", "Rule updated");
    },
  });
}