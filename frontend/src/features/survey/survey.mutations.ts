// survey.mutations.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { surveyApi } from "./survey.api";
import { surveyKeys } from "./survey.queries";
import { useToast } from "@/components/ui/Toast";
import { normalizeApiError } from "@/lib/api/errors";
import type {
  SurveyFormData,
  QuestionFormData,
  SkipLogicFormData,
} from "./survey.schema";

export function useCreateSurvey() {
  const qc = useQueryClient();
  const { push } = useToast();
  return useMutation({
    mutationFn: (input: SurveyFormData) => surveyApi.create(input),
    onSuccess: (s) => {
      qc.invalidateQueries({ queryKey: surveyKeys.all });
      push("success", `Survey ${s.code} created`);
    },
    onError: (err) =>
      push("error", normalizeApiError(err).detail ?? "Failed to create survey"),
  });
}

export function usePublishSurvey(surveyId: string) {
  const qc = useQueryClient();
  const { push } = useToast();
  return useMutation({
    mutationFn: () => surveyApi.publish(surveyId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: surveyKeys.all });
      push("success", "Survey published");
    },
  });
}

export function useAddQuestion(versionId: string) {
  const qc = useQueryClient();
  const { push } = useToast();
  return useMutation({
    mutationFn: (input: QuestionFormData) =>
      surveyApi.createQuestion(versionId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: surveyKeys.all });
      push("success", "Question added");
    },
  });
}

export function useAddSkipLogic(versionId: string) {
  const qc = useQueryClient();
  const { push } = useToast();
  return useMutation({
    mutationFn: (input: SkipLogicFormData) =>
      surveyApi.createSkipLogic(versionId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: surveyKeys.all });
      push("success", "Skip logic added");
    },
  });
}