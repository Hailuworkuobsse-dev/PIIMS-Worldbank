import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { geoApi } from "./geo.api";
import type { GeoFilters } from "./geo.types";

export const geoKeys = {
  all: ["geo"] as const,
  beneficiaries: (f: GeoFilters) =>
    [...geoKeys.all, "beneficiaries", f] as const,
  interventions: (f: GeoFilters) =>
    [...geoKeys.all, "interventions", f] as const,
};

export function useGeoBeneficiaries(f: GeoFilters) {
  return useQuery({
    queryKey: geoKeys.beneficiaries(f),
    queryFn: () => geoApi.beneficiaries(f),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
    enabled: f.layer === "beneficiaries" || f.layer === "heatmap",
  });
}

export function useGeoInterventions(f: GeoFilters) {
  return useQuery({
    queryKey: geoKeys.interventions(f),
    queryFn: () => geoApi.interventions(f),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
    enabled: f.layer === "interventions",
  });
}