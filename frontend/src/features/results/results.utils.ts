import type { ChipTone } from "@/components/ui/Chip";
import type { TrafficLightStatus, IndicatorDirection } from "./results.types";

export function trafficLightTone(s: TrafficLightStatus): ChipTone {
  switch (s) {
    case "ON_TRACK":
      return "green";
    case "AT_RISK":
      return "amber";
    case "OFF_TRACK":
      return "red";
    case "NOT_STARTED":
      return "grey";
  }
}

export function trafficLightLabelKey(s: TrafficLightStatus): string {
  return `results.traffic.${s.toLowerCase()}`;
}

/**
 * Computes achievement % respecting indicator direction.
 * For INCREASE direction: (actual - baseline) / (target - baseline)
 * For DECREASE direction: (baseline - actual) / (baseline - target)
 */
export function computeAchievement(
  baseline: number | undefined,
  target: number | undefined,
  actual: number | undefined,
  direction: IndicatorDirection,
): number | undefined {
  if (actual == null || target == null || baseline == null) return undefined;
  const span = direction === "INCREASE" ? target - baseline : baseline - target;
  if (span <= 0) return undefined;
  const progress =
    direction === "INCREASE" ? actual - baseline : baseline - actual;
  return Math.max(0, Math.min(200, (progress / span) * 100));
}

/**
 * Traffic-light rule from the SRD:
 *   ≥ 90% → ON_TRACK
 *   60–89% → AT_RISK
 *   < 60%  → OFF_TRACK
 */
export function computeTrafficLight(
  achievementPct: number | undefined,
): TrafficLightStatus {
  if (achievementPct == null) return "NOT_STARTED";
  if (achievementPct >= 90) return "ON_TRACK";
  if (achievementPct >= 60) return "AT_RISK";
  return "OFF_TRACK";
}