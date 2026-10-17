import { describe, it, expect } from 'vitest';
import { computeDelaySeverity, computeSupplierScore } from '../procurement.utils.js';
import { createProcurementSchema, createContractSchema } from '../procurement.schemas.js';

describe('computeDelaySeverity', () => {
  it('returns LOW for < 15 days', () => {
    expect(computeDelaySeverity(0)).toBe('LOW');
    expect(computeDelaySeverity(14)).toBe('LOW');
  });

  it('returns MEDIUM for 15-29 days', () => {
    expect(computeDelaySeverity(15)).toBe('MEDIUM');
    expect(computeDelaySeverity(29)).toBe('MEDIUM');
  });

  it('returns HIGH for 30-59 days', () => {
    expect(computeDelaySeverity(30)).toBe('HIGH');
    expect(computeDelaySeverity(59)).toBe('HIGH');
  });

  it('returns CRITICAL for >= 60 days', () => {
    expect(computeDelaySeverity(60)).toBe('CRITICAL');
    expect(computeDelaySeverity(120)).toBe('CRITICAL');
  });
});

describe('computeSupplierScore', () => {
  it('returns ~100 for perfect performance', () => {
    expect(computeSupplierScore(10, 0, 0, 20)).toBe(100);
  });

  it('returns lower for late deliveries', () => {
    const perfect = computeSupplierScore(10, 0, 0, 20);
    const late = computeSupplierScore(5, 5, 0, 20);
    expect(late).toBeLessThan(perfect);
  });

  it('penalizes quality flags', () => {
    const clean = computeSupplierScore(5, 5, 0, 10);
    const flagged = computeSupplierScore(5, 5, 3, 10);
    expect(flagged).toBeLessThan(clean);
  });

  it('clamps between 0 and 100', () => {
    expect(computeSupplierScore(0, 0, 0, 0)).toBeLessThanOrEqual(100);
    expect(computeSupplierScore(0, 0, 100, 0)).toBeGreaterThanOrEqual(0);
  });
});

describe('createProcurementSchema', () => {
  it('accepts valid procurement', () => {
    expect(
      createProcurementSchema.safeParse({
        projectId: '00000000-0000-4000-8000-000000000001',
        planRef: 'PROC-001',
        description: 'Supply and install solar home systems',
        method: 'ICB',
        estimatedAmount: '2000000',
        currency: 'ETB',
        planDate: '2026-11-01'
      }).success
    ).toBe(true);
  });

  it('rejects short description', () => {
    expect(
      createProcurementSchema.safeParse({
        projectId: '00000000-0000-4000-8000-000000000001',
        planRef: 'PROC-001',
        description: 'HI',
        method: 'ICB',
        currency: 'ETB'
      }).success
    ).toBe(false);
  });
});

describe('createContractSchema', () => {
  it('accepts valid contract', () => {
    expect(
      createContractSchema.safeParse({
        projectId: '00000000-0000-4000-8000-000000000001',
        supplierId: '00000000-0000-4000-8000-000000000002',
        contractNo: 'CTR-2026-001',
        title: 'Supply of solar systems – Lot 1',
        amount: '1950000',
        currency: 'ETB',
        signedDate: '2026-10-10',
        startDate: '2026-11-01',
        endDate: '2027-10-31',
        status: 'ACTIVE'
      }).success
    ).toBe(true);
  });

  it('rejects end date before start date', () => {
    const r = createContractSchema.safeParse({
      projectId: '00000000-0000-4000-8000-000000000001',
      supplierId: '00000000-0000-4000-8000-000000000002',
      contractNo: 'CTR-001',
      title: 'Test contract',
      amount: '100',
      currency: 'ETB',
      startDate: '2027-01-01',
      endDate: '2026-01-01'
    });
    expect(r.success).toBe(false);
  });
});