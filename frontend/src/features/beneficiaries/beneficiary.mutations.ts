import { useMutation, useQueryClient } from "@tanstack/react-query";
import { beneficiaryApi } from "./beneficiary.api";
import { beneficiaryKeys } from "./beneficiary.queries";
import { projectKeys } from "@/features/projects/project.queries";
import { useToast } from "@/components/ui/Toast";
import { normalizeApiError } from "@/lib/api/errors";
import type {
  BeneficiaryWithConsentFormData,
  ServiceDeliveryFormData,
} from "./beneficiary.schema";

export function useCreateBeneficiary() {
  const qc = useQueryClient();
  const { push } = useToast();
  return useMutation({
    mutationFn: (input: BeneficiaryWithConsentFormData) =>
      beneficiaryApi.create(input),
    onSuccess: (b) => {
      qc.invalidateQueries({ queryKey: beneficiaryKeys.all });
      push("success", `Beneficiary ${b.uniqueId} registered`);
    },
    onError: (err) =>
      push("error", normalizeApiError(err).detail ?? "Registration failed"),
  });
}

export function useVerifyBeneficiary() {
  const qc = useQueryClient();
  const { push } = useToast();
  return useMutation({
    mutationFn: ({
      id,
      verified,
      notes,
    }: {
      id: string;
      verified: boolean;
      notes?: string;
    }) => beneficiaryApi.verify(id, verified, notes),
    onSuccess: (b) => {
      qc.invalidateQueries({ queryKey: beneficiaryKeys.all });
      push(
        "success",
        b.status === "VERIFIED"
          ? "Beneficiary verified"
          : "Verification rejected",
      );
    },
    onError: (err) =>
      push("error", normalizeApiError(err).detail ?? "Verification failed"),
  });
}

export function useMergeBeneficiaries() {
  const qc = useQueryClient();
  const { push } = useToast();
  return useMutation({
    mutationFn: ({
      primaryId,
      duplicateId,
    }: {
      primaryId: string;
      duplicateId: string;
    }) => beneficiaryApi.merge(primaryId, duplicateId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: beneficiaryKeys.all });
      push("success", "Duplicates merged");
    },
  });
}

export function useCreateServiceDelivery() {
  const qc = useQueryClient();
  const { push } = useToast();
  return useMutation({
    mutationFn: ({
      input,
      photo,
    }: {
      input: ServiceDeliveryFormData;
      photo?: File | undefined;
    }) => beneficiaryApi.createDelivery(input, photo),
    onSuccess: (d) => {
      qc.invalidateQueries({ queryKey: beneficiaryKeys.all });
      qc.invalidateQueries({ queryKey: projectKeys.detail(d.projectId) });
      push("success", `Service delivery recorded · ${d.productName}`);
    },
    onError: (err) =>
      push(
        "error",
        normalizeApiError(err).detail ?? "Failed to record delivery",
      ),
  });
}

export function useVerifyDelivery() {
  const qc = useQueryClient();
  const { push } = useToast();
  return useMutation({
    mutationFn: ({ id, verified }: { id: string; verified: boolean }) =>
      beneficiaryApi.verifyDelivery(id, verified),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: beneficiaryKeys.all });
      push("success", "Delivery verified");
    },
  });
}