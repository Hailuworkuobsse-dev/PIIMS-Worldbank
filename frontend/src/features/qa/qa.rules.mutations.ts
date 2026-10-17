import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { qaKeys } from "./qa.queries";
import { useToast } from "@/components/ui/Toast";
import { normalizeApiError } from "@/lib/api/errors";
import type { QARule } from "./qa.types";
import type { QARuleFormData } from "./qa.rules.schema";

interface Envelope<T> {
  data: T;
}

export function useCreateQARule() {
  const qc = useQueryClient();
  const { push } = useToast();
  return useMutation({
    mutationFn: async (input: QARuleFormData) => {
      const { data } = await api.post<Envelope<QARule>>("/qa/rules", input);
      return data.data;
    },
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: qaKeys.rules() });
      push("success", `Rule ${r.code} created`);
    },
    onError: (err) =>
      push("error", normalizeApiError(err).detail ?? "Failed to create rule"),
  });
}

export function useUpdateQARule() {
  const qc = useQueryClient();
  const { push } = useToast();
  return useMutation({
    mutationFn: async ({
      ruleId,
      patch,
    }: {
      ruleId: string;
      patch: Partial<QARuleFormData>;
    }) => {
      const { data } = await api.patch<Envelope<QARule>>(
        `/qa/rules/${ruleId}`,
        patch,
      );
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qaKeys.rules() });
      push("success", "Rule updated");
    },
    onError: (err) =>
      push("error", normalizeApiError(err).detail ?? "Update failed"),
  });
}

export function useDeleteQARule() {
  const qc = useQueryClient();
  const { push } = useToast();
  return useMutation({
    mutationFn: async (ruleId: string) => {
      await api.delete(`/qa/rules/${ruleId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qaKeys.rules() });
      push("success", "Rule deleted");
    },
    onError: (err) =>
      push("error", normalizeApiError(err).detail ?? "Delete failed"),
  });
}