/**
 * Compute delay severity based on days overdue.
 */
export function computeDelaySeverity(
  daysOverdue: number
): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  if (daysOverdue >= 60) return 'CRITICAL';
  if (daysOverdue >= 30) return 'HIGH';
  if (daysOverdue >= 15) return 'MEDIUM';
  return 'LOW';
}

/**
 * Compute supplier composite score (0-100).
 *   - 60% weight on delivery timeliness
 *   - 20% weight on volume (contracts count, capped at 10)
 *   - 20% penalty on quality flags
 */
export function computeSupplierScore(
  onTime: number,
  late: number,
  qualityFlags: number,
  contractsCount: number
): number {
  const total = onTime + late;
  const timeliness = total > 0 ? (onTime / total) * 100 : 50;
  const volumeScore = Math.min(100, contractsCount * 10);
  const qualityPenalty = Math.min(50, qualityFlags * 10);

  const score = timeliness * 0.6 + volumeScore * 0.2 + (100 - qualityPenalty) * 0.2;
  return Math.round(Math.max(0, Math.min(100, score)) * 100) / 100;
}