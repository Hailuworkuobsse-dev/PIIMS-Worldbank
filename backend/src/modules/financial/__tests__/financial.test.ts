import { describe, it, expect } from 'vitest';
import { buildExecution, toEtb } from '../financial.utils.js';
import { createBudgetSchema, createDisbursementSchema } from '../financial.schemas.js';

describe('toEtb', () => {
  it('returns ETB unchanged', () => {
    expect(toEtb(100, 'ETB')).toBe(100);
  });

  it('converts USD at fixed rate', () => {
    expect(toEtb(100, 'USD')).toBe(5700);
  });

  it('converts EUR at fixed rate', () => {
    expect(toEtb(100, 'EUR')).toBe(6200);
  });
});

describe('buildExecution', () => {
  it('computes totals and execution rate', () => {
    const result = buildExecution(
      [
        { componentId: 'c1', appropriation: 1000000, released: 500000, expended: 400000, committed: 0, currency: 'ETB' },
        { componentId: 'c2', appropriation: 500000, released: 250000, expended: 100000, committed: 0, currency: 'ETB' }
      ],
      [
        { componentId: 'c1', name: 'Component 1' },
        { componentId: 'c2', name: 'Component 2' }
      ]
    );
    expect(result.totalAppropriation).toBe('1500000.00');
    expect(result.totalReleased).toBe('750000.00');
    expect(result.totalExpended).toBe('500000.00');
    expect(result.executionRate).toBe(33.33);
    expect(result.byComponent).toHaveLength(2);
  });

  it('handles zero appropriation', () => {
    const result = buildExecution([], []);
    expect(result.executionRate).toBe(0);
    expect(result.byComponent).toEqual([]);
  });
});

describe('createBudgetSchema', () => {
  it('accepts valid budget', () => {
    expect(
      createBudgetSchema.safeParse({
        projectId: '00000000-0000-4000-8000-000000000001',
        componentId: '',
        fiscalYear: 2026,
        currency: 'ETB',
        appropriation: '5000000.00'
      }).success
    ).toBe(true);
  });

  it('rejects invalid amount', () => {
    expect(
      createBudgetSchema.safeParse({
        projectId: '00000000-0000-4000-8000-000000000001',
        fiscalYear: 2026,
        currency: 'ETB',
        appropriation: 'abc'
      }).success
    ).toBe(false);
  });
});

describe('createDisbursementSchema', () => {
  it('accepts valid disbursement', () => {
    expect(
      createDisbursementSchema.safeParse({
        projectId: '00000000-0000-4000-8000-000000000001',
        sourceOrgId: '00000000-0000-4000-8000-000000000002',
        category: 'CATEGORY_1',
        amount: '1500000.00',
        currency: 'ETB',
        valueDate: '2026-10-15',
        referenceNo: 'WB-DISB-001234',
        status: 'APPROVED'
      }).success
    ).toBe(true);
  });

  it('rejects missing valueDate', () => {
    expect(
      createDisbursementSchema.safeParse({
        projectId: '00000000-0000-4000-8000-000000000001',
        sourceOrgId: '00000000-0000-4000-8000-000000000002',
        category: 'CATEGORY_1',
        amount: '100.00',
        currency: 'ETB',
        valueDate: ''
      }).success
    ).toBe(false);
  });
});