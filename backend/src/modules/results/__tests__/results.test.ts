import { describe, it, expect } from 'vitest';
import { computeAchievement, computeTrafficLight } from '../results.utils.js';
import { createIndicatorSchema, recordValueSchema } from '../results.schemas.js';

describe('computeAchievement', () => {
  it('computes correct % for INCREASE direction', () => {
    expect(computeAchievement(0, 100, 50, 'INCREASE')).toBe(50);
    expect(computeAchievement(0, 100, 90, 'INCREASE')).toBe(90);
    expect(computeAchievement(0, 100, 100, 'INCREASE')).toBe(100);
    expect(computeAchievement(0, 100, 150, 'INCREASE')).toBe(150);
  });

  it('computes correct % for DECREASE direction', () => {
    expect(computeAchievement(100, 0, 50, 'DECREASE')).toBe(50);
    expect(computeAchievement(100, 20, 60, 'DECREASE')).toBe(50);
    expect(computeAchievement(100, 20, 20, 'DECREASE')).toBe(100);
  });

  it('returns null when any input missing', () => {
    expect(computeAchievement(null, 100, 50, 'INCREASE')).toBeNull();
    expect(computeAchievement(0, null, 50, 'INCREASE')).toBeNull();
    expect(computeAchievement(0, 100, null, 'INCREASE')).toBeNull();
  });

  it('clamps at 200%', () => {
    expect(computeAchievement(0, 100, 500, 'INCREASE')).toBe(200);
  });

  it('returns null when baseline === target', () => {
    expect(computeAchievement(100, 100, 100, 'INCREASE')).toBeNull();
  });
});

describe('computeTrafficLight', () => {
  it('ON_TRACK for >= 90%', () => {
    expect(computeTrafficLight(90)).toBe('ON_TRACK');
    expect(computeTrafficLight(95)).toBe('ON_TRACK');
    expect(computeTrafficLight(100)).toBe('ON_TRACK');
  });

  it('AT_RISK for 60-89%', () => {
    expect(computeTrafficLight(60)).toBe('AT_RISK');
    expect(computeTrafficLight(75)).toBe('AT_RISK');
    expect(computeTrafficLight(89)).toBe('AT_RISK');
  });

  it('OFF_TRACK for < 60%', () => {
    expect(computeTrafficLight(0)).toBe('OFF_TRACK');
    expect(computeTrafficLight(30)).toBe('OFF_TRACK');
    expect(computeTrafficLight(59)).toBe('OFF_TRACK');
  });

  it('NOT_STARTED for null', () => {
    expect(computeTrafficLight(null)).toBe('NOT_STARTED');
    expect(computeTrafficLight(undefined)).toBe('NOT_STARTED');
  });
});

describe('createIndicatorSchema', () => {
  it('accepts a valid indicator', () => {
    const r = createIndicatorSchema.safeParse({
      subcomponentId: '00000000-0000-4000-8000-000000000001',
      code: 'IND-001',
      name: 'Households with solar systems',
      indicatorType: 'OUTPUT',
      unit: 'households',
      baseline: 0,
      target: 5000,
      frequency: 'QUARTERLY',
      direction: 'INCREASE'
    });
    expect(r.success).toBe(true);
  });

  it('rejects missing unit', () => {
    const r = createIndicatorSchema.safeParse({
      subcomponentId: '00000000-0000-4000-8000-000000000001',
      code: 'IND-001',
      name: 'Test',
      indicatorType: 'OUTPUT',
      unit: '',
      frequency: 'QUARTERLY',
      direction: 'INCREASE'
    });
    expect(r.success).toBe(false);
  });
});

describe('recordValueSchema', () => {
  it('accepts valid value', () => {
    expect(recordValueSchema.safeParse({
      period: 'Q3-2026', fiscalYear: 2026, value: 4250
    }).success).toBe(true);
  });

  it('rejects non-numeric value', () => {
    expect(recordValueSchema.safeParse({
      period: 'Q3-2026', fiscalYear: 2026, value: 'abc'
    }).success).toBe(false);
  });
});