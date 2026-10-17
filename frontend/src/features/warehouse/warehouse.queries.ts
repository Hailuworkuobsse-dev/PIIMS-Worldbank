// warehouse.queries.ts
import { useQuery } from "@tanstack/react-query";
import { warehouseApi } from "./warehouse.api";

export const warehouseKeys = {
  all: ["warehouse"] as const,
  waveDatasets: () => [...warehouseKeys.all, "wave-datasets"] as const,
  panelLinks: (waveId?: string) =>
    [...warehouseKeys.all, "panel-links", waveId ?? "all"] as const,
  research: () => [...warehouseKeys.all, "research"] as const,
  requests: () => [...warehouseKeys.all, "requests"] as const,
};

export function useWaveDatasets() {
  return useQuery({
    queryKey: warehouseKeys.waveDatasets(),
    queryFn: () => warehouseApi.waveDatasets(),
    staleTime: 60_000,
  });
}

export function usePanelLinks(waveId?: string) {
  return useQuery({
    queryKey: warehouseKeys.panelLinks(waveId),
    queryFn: () => warehouseApi.panelLinks(waveId),
    staleTime: 60_000,
  });
}

export function useResearchDatasets() {
  return useQuery({
    queryKey: warehouseKeys.research(),
    queryFn: () => warehouseApi.researchDatasets(),
    staleTime: 60_000,
  });
}

export function useDataRequests() {
  return useQuery({
    queryKey: warehouseKeys.requests(),
    queryFn: () => warehouseApi.requests(),
    staleTime: 60_000,
  });
}