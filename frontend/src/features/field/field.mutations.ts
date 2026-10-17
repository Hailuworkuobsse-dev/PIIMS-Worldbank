// field.mutations.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fieldApi } from "./field.api";
import { fieldKeys } from "./field.queries";
import { useToast } from "@/components/ui/Toast";
import { normalizeApiError } from "@/lib/api/errors";
import type { Submission } from "./field.types";

export function useSubmitInterview() {
  const qc = useQueryClient();
  const { push } = useToast();
  return useMutation({
    mutationFn: (submission: Submission) => fieldApi.submit(submission),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: fieldKeys.all });
      push("success", "Interview submitted");
    },
    onError: (err) =>
      push("error", normalizeApiError(err).detail ?? "Submission failed"),
  });
}