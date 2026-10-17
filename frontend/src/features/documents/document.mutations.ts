import { useMutation, useQueryClient } from "@tanstack/react-query";
import { documentApi } from "./document.api";
import { documentKeys } from "./document.queries";
import { useToast } from "@/components/ui/Toast";
import { normalizeApiError } from "@/lib/api/errors";
import type { DocumentUploadFormData } from "./document.schema";

export function useUploadDocument() {
  const qc = useQueryClient();
  const { push } = useToast();
  return useMutation({
    mutationFn: ({
      input,
      file,
    }: {
      input: DocumentUploadFormData;
      file: File;
    }) => documentApi.upload(input, file),
    onSuccess: (d) => {
      qc.invalidateQueries({ queryKey: documentKeys.all });
      push("success", `Document "${d.title}" uploaded`);
    },
    onError: (err) =>
      push("error", normalizeApiError(err).detail ?? "Upload failed"),
  });
}

export function useRestoreVersion(docId: string) {
  const qc = useQueryClient();
  const { push } = useToast();
  return useMutation({
    mutationFn: (versionId: string) =>
      documentApi.restoreVersion(docId, versionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: documentKeys.all });
      push("success", "Version restored");
    },
  });
}