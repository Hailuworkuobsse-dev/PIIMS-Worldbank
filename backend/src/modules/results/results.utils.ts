import type { IndicatorDirection, TrafficLight } from '@prisma/client';

/**
 * Achievement % computed respecting indicator direction.
 *   INCREASE: (actual − baseline) / (target − baseline) × 100
 *   DECREASE: (baseline − actual) / (baseline − target) × 100
 * Clamped to [0, 200] so overshoot is capped at 200%.
 */
export function computeAchievement(
  baseline: number | null | undefined,
  target: number | null | undefined,
  actual: number | null | undefined,
  direction: IndicatorDirection
): number | null {
  if (actual == null || target == null || baseline == null) return null;
  const span = direction === 'INCREASE' ? target - baseline : baseline - target;
  if (span === 0) return null;
  const progress = direction === 'INCREASE' ? actual - baseline : baseline - actual;
  return Math.round(Math.max(0, Math.min(200, (progress / span) * 100)) * 100) / 100;
}

/**
 * Traffic-light rule from the SRD:
 *   ≥ 90% → ON_TRACK
 *   60–89% → AT_RISK
 *   < 60% → OFF_TRACK
 *   null → NOT_STARTED
 */
export function computeTrafficLight(
  achievementPct: number | null | undefined
): TrafficLight {
  if (achievementPct == null) return 'NOT_STARTED';
  if (achievementPct >= 90) return 'ON_TRACK';
  if (achievementPct >= 60) return 'AT_RISK';
  return 'OFF_TRACK';
}

/**
 * Sum disaggregation values across an array of value rows.
 * Returns { gender: { MALE: 100, FEMALE: 50 }, region: { ... } }
 */
export function mergeDisaggregation(
  rows: Array<Record<string, Record<string, number>> | null | undefined>
): Record<string, Record<string, number>> {
  const out: Record<string, Record<string, number>> = {};
  for (const row of rows) {
    if (!row) continue;
    for (const [dim, vals] of Object.entries(row)) {
      if (!out[dim]) out[dim] = {};
      for (const [key, val] of Object.entries(vals)) {
        out[dim]![key] = (out[dim]![key] ?? 0) + Number(val);
      }
    }
  }
  return out;
}