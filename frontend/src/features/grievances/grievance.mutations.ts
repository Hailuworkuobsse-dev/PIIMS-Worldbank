import { useMutation, useQueryClient } from "@tanstack/react-query";
import { grievanceApi } from "./grievance.api";
import { grievanceKeys } from "./grievance.queries";
import { useToast } from "@/components/ui/Toast";
import { normalizeApiError } from "@/lib/api/errors";
import type {
  GrievanceIntakeFormData,
  GrievanceAssignFormData,
  GrievanceResolveFormData,
  GrievanceEscalateFormData,
} from "./grievance.schema";

export function useCreateGrievance() {
  const qc = useQueryClient();
  const { push } = useToast();
  return useMutation({
    mutationFn: (input: GrievanceIntakeFormData) => grievanceApi.create(input),
    onSuccess: (g) => {
      qc.invalidateQueries({ queryKey: grievanceKeys.all });
      push("success", `Grievance ${g.ticketNo} recorded`);
    },
    onError: (err) =>
      push(
        "error",
        normalizeApiError(err).detail ?? "Failed to record grievance",
      ),
  });
}

export function useAssignGrievance(grievanceId: string) {
  const qc = useQueryClient();
  const { push } = useToast();
  return useMutation({
    mutationFn: (input: GrievanceAssignFormData) =>
      grievanceApi.assign(grievanceId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: grievanceKeys.all });
      push("success", "Grievance assigned");
    },
  });
}

export function useResolveGrievance(grievanceId: string) {
  const qc = useQueryClient();
  const { push } = useToast();
  return useMutation({
    mutationFn: (input: GrievanceResolveFormData) =>
      grievanceApi.resolve(grievanceId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: grievanceKeys.all });
      push("success", "Grievance resolved");
    },
  });
}

export function useEscalateGrievance(grievanceId: string) {
  const qc = useQueryClient();
  const { push } = useToast();
  return useMutation({
    mutationFn: (input: GrievanceEscalateFormData) =>
      grievanceApi.escalate(grievanceId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: grievanceKeys.all });
      push("success", "Grievance escalated");
    },
  });
}