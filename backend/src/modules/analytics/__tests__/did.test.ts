import { describe, it, expect } from 'vitest';
import { computeDiD, computeDiDFromRaw } from '../did.js';

const indicator = { indicatorId: 'i1', indicatorCode: 'IMP-INC-001', indicatorName: 'Monthly income', unit: 'ETB' };

describe('computeDiD', () => {
  it('computes simple DiD', () => {
    const result = computeDiD(
      indicator,
      { baselineMean: 3200, baselineN: 100, baselineSD: 800, endlineMean: 5300, endlineN: 95, endlineSD: 1200 },
      { baselineMean: 3100, baselineN: 100, baselineSD: 750, endlineMean: 3800, endlineN: 100, endlineSD: 850 }
    );
    expect(result.treatmentChange).toBe(2100);
    expect(result.controlChange).toBe(700);
    expect(result.did).toBe(1400);
    expect(result.significant).toBe(true);
  });

  it('returns 0 DiD when changes are equal', () => {
    const result = computeDiD(
      indicator,
      { baselineMean: 100, baselineN: 50, baselineSD: 10, endlineMean: 150, endlineN: 50, endlineSD: 12 },
      { baselineMean: 100, baselineN: 50, baselineSD: 10, endlineMean: 150, endlineN: 50, endlineSD: 12 }
    );
    expect(result.did).toBe(0);
    expect(result.significant).toBe(false);
  });

  it('handles negative DiD', () => {
    const result = computeDiD(
      indicator,
      { baselineMean: 100, baselineN: 50, baselineSD: 10, endlineMean: 110, endlineN: 50, endlineSD: 12 },
      { baselineMean: 100, baselineN: 50, baselineSD: 10, endlineMean: 160, endlineN: 50, endlineSD: 12 }
    );
    expect(result.did).toBe(-50);
  });
});

describe('computeDiDFromRaw', () => {
  it('computes from raw arrays', () => {
    const result = computeDiDFromRaw(
      indicator,
      [3000, 3200, 3400, 3100, 3300],
      [5100, 5300, 5500, 5200, 5400],
      [3050, 3150, 3050, 3150, 3050],
      [3800, 3900, 3700, 3800, 3800]
    );
    expect(result.treatmentChange).toBeCloseTo(2100, -1);
    expect(result.controlChange).toBeCloseTo(700, -1);
    expect(result.did).toBeCloseTo(1400, -1);
  });
});