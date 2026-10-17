import type { FinancialExecutionDTO } from './financial.types.js';

/**
 * Compute the FX-conversion rate to ETB for a given currency.
 * In production this is fetched from a rates service. For MVP, use fixed rates.
 */
export function toEtb(amount: string | number, currency: string): number {
  const n = Number(amount);
  const rate = currency === 'USD' ? 57 : currency === 'EUR' ? 62 : 1;
  return n * rate;
}

/**
 * Build a FinancialExecutionDTO from a set of budgets + components.
 */
export function buildExecution(
  budgets: Array<{
    componentId: string | null;
    appropriation: unknown;
    released: unknown;
    expended: unknown;
    committed: unknown;
    currency: string;
  }>,
  components: Array<{ componentId: string; name: string }>
): FinancialExecutionDTO {
  const componentMap = new Map(components.map((c) => [c.componentId, c.name]));

  const byComponentMap = new Map<
    string,
    { appropriation: number; released: number; expended: number }
  >();

  let totalAppropriation = 0;
  let totalReleased = 0;
  let totalExpended = 0;
  let totalCommitted = 0;
  const currency = budgets[0]?.currency ?? 'ETB';

  for (const b of budgets) {
    const app = toEtb(Number(b.appropriation), b.currency);
    const rel = toEtb(Number(b.released), b.currency);
    const exp = toEtb(Number(b.expended), b.currency);
    const com = toEtb(Number(b.committed), b.currency);
    totalAppropriation += app;
    totalReleased += rel;
    totalExpended += exp;
    totalCommitted += com;

    const key = b.componentId ?? '__whole__';
    if (!byComponentMap.has(key)) {
      byComponentMap.set(key, { appropriation: 0, released: 0, expended: 0 });
    }
    const g = byComponentMap.get(key)!;
    g.appropriation += app;
    g.released += rel;
    g.expended += exp;
  }

  const byComponent = Array.from(byComponentMap.entries()).map(([componentId, data]) => ({
    componentId,
    componentName: componentMap.get(componentId) ?? 'Whole project',
    appropriation: data.appropriation.toFixed(2),
    released: data.released.toFixed(2),
    expended: data.expended.toFixed(2),
    executionPct:
      data.appropriation > 0
        ? Math.round((data.expended / data.appropriation) * 10000) / 100
        : 0
  }));

  return {
    totalAppropriation: totalAppropriation.toFixed(2),
    totalReleased: totalReleased.toFixed(2),
    totalExpended: totalExpended.toFixed(2),
    totalCommitted: totalCommitted.toFixed(2),
    executionRate:
      totalAppropriation > 0
        ? Math.round((totalExpended / totalAppropriation) * 10000) / 100
        : 0,
    currency,
    byComponent
  };
}