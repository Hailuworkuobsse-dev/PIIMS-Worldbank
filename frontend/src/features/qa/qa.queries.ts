// qa.queries.ts
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { qaApi } from "./qa.api";
import type { QAFlagFilters } from "./qa.types";

export const qaKeys = {
  all: ["qa"] as const,
  flags: (f: QAFlagFilters) => [...qaKeys.all, "flags", f] as const,
  scorecards: (waveId?: string) =>
    [...qaKeys.all, "scorecards", waveId ?? "all"] as const,
  stats: (waveId?: string) =>
    [...qaKeys.all, "stats", waveId ?? "all"] as const,
  rules: () => [...qaKeys.all, "rules"] as const,
};

export function useQAFlags(f: QAFlagFilters) {
  return useQuery({
    queryKey: qaKeys.flags(f),
    queryFn: () => qaApi.listFlags(f),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

export function useScorecards(waveId?: string) {
  return useQuery({
    queryKey: qaKeys.scorecards(waveId),
    queryFn: () => qaApi.scorecards(waveId),
    staleTime: 60_000,
  });
}

export function useQAStats(waveId?: string) {
  return useQuery({
    queryKey: qaKeys.stats(waveId),
    queryFn: () => qaApi.stats(waveId),
    staleTime: 60_000,
  });
}

export function useQARules() {
  return useQuery({
    queryKey: qaKeys.rules(),
    queryFn: () => qaApi.rules(),
    staleTime: 5 * 60_000,
  });
}