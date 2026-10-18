import { describe, it, expect } from 'vitest';
import {
  createProjectSchema, updateProjectSchema, stageAdvanceSchema
} from '../project.schemas.js';

describe('createProjectSchema', () => {
  const valid = {
    name: 'Solar Mini-Grid Oromia Phase 1',
    nameAm: '',
    description: '',
    subsector: 'Solar Mini-Grid',
    sector: 'ENERGY' as const,
    ownerOrgId: '00000000-0000-4000-8000-000000000001',
    implementationArrangement: 'PIU' as const,
    wbCreditNo: '',
    region: 'Oromia',
    zone: 'East Shewa',
    woreda: 'Bora',
    kebele: 'K1',
    totalBudget: { amount: '15000000.00', currency: 'ETB' as const },
    startDate: '2026-10-01',
    endDate: '2029-09-30',
    financingSource: [
      { source: 'WORLD_BANK' as const, amount: '12000000.00', currency: 'ETB' as const, referenceNo: 'IDA-X' },
      { source: 'GOVERNMENT' as const, amount: '3000000.00', currency: 'ETB' as const, referenceNo: '' }
    ]
  };

  it('accepts a valid project', () => {
    expect(createProjectSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects a financing sum mismatch', () => {
    const bad = { ...valid, totalBudget: { amount: '99999999.00', currency: 'ETB' as const } };
    const r = createProjectSchema.safeParse(bad);
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.some((i) => i.path.includes('financingSource'))).toBe(true);
    }
  });

  it('rejects end date before start date', () => {
    const bad = { ...valid, endDate: '2026-09-01' };
    expect(createProjectSchema.safeParse(bad).success).toBe(false);
  });

  it('rejects short name', () => {
    expect(createProjectSchema.safeParse({ ...valid, name: 'AB' }).success).toBe(false);
  });
});

describe('updateProjectSchema', () => {
  it('requires version', () => {
    expect(updateProjectSchema.safeParse({ name: 'X' }).success).toBe(false);
  });

  it('accepts partial updates with version', () => {
    // name must satisfy the same min(3) rule as create (e.g. "Solar")
    expect(
      updateProjectSchema.safeParse({ version: 1, name: 'Solar' }).success
    ).toBe(true);
  });

  it('rejects a too-short name on update', () => {
    expect(
      updateProjectSchema.safeParse({ version: 1, name: 'X' }).success
    ).toBe(false);
  });
});

describe('stageAdvanceSchema', () => {
  it('accepts PROFILE stage with required checklist', () => {
    expect(
      stageAdvanceSchema.safeParse({
        targetStage: 'PROFILE',
        checklist: { identification_complete: true }
      }).success
    ).toBe(true);
  });

  it('rejects PROFILE without checklist item', () => {
    expect(
      stageAdvanceSchema.safeParse({
        targetStage: 'PROFILE',
        checklist: {}
      }).success
    ).toBe(false);
  });

  it('rejects APPRAISAL with only one of two items', () => {
    expect(
      stageAdvanceSchema.safeParse({
        targetStage: 'APPRAISAL',
        checklist: { feasibility_approved: true }
      }).success
    ).toBe(false);
  });
});