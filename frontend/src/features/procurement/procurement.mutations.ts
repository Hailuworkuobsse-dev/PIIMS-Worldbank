import { useMutation, useQueryClient } from "@tanstack/react-query";
import { procurementApi } from "./procurement.api";
import { procurementKeys } from "./procurement.queries";
import { useToast } from "@/components/ui/Toast";
import { normalizeApiError } from "@/lib/api/errors";
import type {
  ProcurementFormData,
  ContractFormData,
} from "./procurement.schema";

export function useCreateProcurement() {
  const qc = useQueryClient();
  const { push } = useToast();
  return useMutation({
    mutationFn: (input: ProcurementFormData) => procurementApi.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: procurementKeys.all });
      push("success", "Procurement line added");
    },
    onError: (err) =>
      push(
        "error",
        normalizeApiError(err).detail ?? "Failed to add procurement line",
      ),
  });
}

export function useCreateContract() {
  const qc = useQueryClient();
  const { push } = useToast();
  return useMutation({
    mutationFn: (input: ContractFormData) =>
      procurementApi.createContract(input),
    onSuccess: (c) => {
      qc.invalidateQueries({ queryKey: procurementKeys.all });
      push("success", `Contract ${c.contractNo} created`);
    },
    onError: (err) =>
      push(
        "error",
        normalizeApiError(err).detail ?? "Failed to create contract",
      ),
  });
}