import { useMutation, useQueryClient } from "@tanstack/react-query";
import { inceptionApi } from "./inception.api";
import { inceptionKeys } from "./inception.queries";
import { projectKeys } from "@/features/projects/project.queries";
import { useToast } from "@/components/ui/Toast";
import { normalizeApiError } from "@/lib/api/errors";
import type {
  SubmitInceptionInput,
  ReviewDecisionInput,
  NoObjectionInput,
} from "./inception.types";

export function useSubmitInception() {
  const qc = useQueryClient();
  const { push } = useToast();
  return useMutation({
    mutationFn: (input: SubmitInceptionInput) => inceptionApi.submit(input),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: inceptionKeys.all });
      qc.invalidateQueries({ queryKey: projectKeys.detail(r.projectId) });
      push("success", `Inception report v${r.version} submitted`);
    },
    onError: (err) => {
      const p = normalizeApiError(err);
      push("error", p.detail ?? "Failed to submit report");
    },
  });
}

export function useReviewInception(reportId: string) {
  const qc = useQueryClient();
  const { push } = useToast();
  return useMutation({
    mutationFn: (input: ReviewDecisionInput) =>
      inceptionApi.review(reportId, input),
    onSuccess: (r) => {
      qc.setQueryData(inceptionKeys.detail(reportId), r);
      qc.invalidateQueries({ queryKey: inceptionKeys.all });
      push(
        "success",
        r.status === "APPROVED" ? "Report approved" : "Review recorded",
      );
    },
    onError: (err) => {
      const p = normalizeApiError(err);
      push("error", p.detail ?? "Failed to record review");
    },
  });
}

export function useNoObjection(reportId: string) {
  const qc = useQueryClient();
  const { push } = useToast();
  return useMutation({
    mutationFn: (input: NoObjectionInput) =>
      inceptionApi.noObjection(reportId, input),
    onSuccess: (r) => {
      qc.setQueryData(inceptionKeys.detail(reportId), r);
      qc.invalidateQueries({ queryKey: inceptionKeys.all });
      qc.invalidateQueries({ queryKey: projectKeys.all });
      push("success", "No-objection recorded");
    },
    onError: (err) => {
      const p = normalizeApiError(err);
      push("error", p.detail ?? "Failed to record no-objection");
    },
  });
}

export function useAddComment(reportId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      text,
      sectionId,
      parentId,
    }: {
      text: string;
      sectionId?: string | undefined;
      parentId?: string | undefined;
    }) => inceptionApi.addComment(reportId, text, sectionId, parentId),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: inceptionKeys.comments(reportId) }),
  });
}

export function useResolveComment(reportId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) =>
      inceptionApi.resolveComment(reportId, commentId),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: inceptionKeys.comments(reportId) }),
  });
}