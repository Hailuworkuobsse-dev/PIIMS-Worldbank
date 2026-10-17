// warehouse.mutations.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { warehouseApi } from "./warehouse.api";
import { warehouseKeys } from "./warehouse.queries";
import { useToast } from "@/components/ui/Toast";
import type { AnonymizationConfig } from "./warehouse.types";

export function useAnonymize() {
  const qc = useQueryClient();
  const { push } = useToast();
  return useMutation({
    mutationFn: ({
      waveId,
      config,
    }: {
      waveId: string;
      config: AnonymizationConfig;
    }) => warehouseApi.anonymize(waveId, config),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: warehouseKeys.research() });
      push("success", "Dataset anonymized");
    },
  });
}

export function useBuildWaveDataset() {
  const qc = useQueryClient();
  const { push } = useToast();
  return useMutation({
    mutationFn: (waveId: string) => warehouseApi.buildWaveDataset(waveId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: warehouseKeys.waveDatasets() });
      push("info", "Wave dataset build queued");
    },
  });
}

export function useRequestAccess() {
  const qc = useQueryClient();
  const { push } = useToast();
  return useMutation({
    mutationFn: ({ datasetId, payload }: { datasetId: string; payload: any }) =>
      warehouseApi.requestAccess(datasetId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: warehouseKeys.requests() });
      push("success", "Data request submitted");
    },
  });
}