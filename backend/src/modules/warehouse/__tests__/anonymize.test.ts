import { describe, it, expect } from 'vitest';
import { anonymize, toCsv, DEFAULT_ANON_CONFIG, type RawRecord } from '../anonymize.js';

const sample: RawRecord[] = [
  { panelId: 'P1', beneficiaryName: 'Aster', phone: '+251911', age: 42, income: 3500, region: 'Oromia', zone: 'East Shewa', woreda: 'Bora' },
  { panelId: 'P2', beneficiaryName: 'Tadesse', phone: '+251922', age: 38, income: 4200, region: 'Oromia', zone: 'East Shewa', woreda: 'Bora' },
  { panelId: 'P3', beneficiaryName: 'Hanna', phone: '+251933', age: 29, income: 5000, region: 'Amhara', zone: 'North Shewa', woreda: 'K1' },
  { panelId: 'P4', beneficiaryName: 'Yohannes', phone: '+251944', age: 51, income: 8000, region: 'Oromia', zone: 'East Shewa', woreda: 'Bora' },
  { panelId: 'P5', beneficiaryName: 'Selam', phone: '+251955', age: 45, income: 3000, region: 'Amhara', zone: 'North Shewa', woreda: 'K1' }
];

describe('anonymize', () => {
  it('L0 returns records unchanged', () => {
    expect(anonymize(sample, { ...DEFAULT_ANON_CONFIG, level: 'L0' })).toEqual(sample);
  });

  it('L1 pseudonymizes names and redacts phone', () => {
    const out = anonymize(sample, { ...DEFAULT_ANON_CONFIG, level: 'L1' });
    expect(out[0]!.beneficiaryName).not.toBe('Aster');
    expect(out[0]!.phone).toBe('[REDACTED]');
    expect(out[0]!.panelId).toBe('P1');
  });

  it('L1 is deterministic across calls', () => {
    const a = anonymize(sample, { ...DEFAULT_ANON_CONFIG, level: 'L1' });
    const b = anonymize(sample, { ...DEFAULT_ANON_CONFIG, level: 'L1' });
    expect(a[0]!.beneficiaryName).toBe(b[0]!.beneficiaryName);
  });

  it('L2 brackets age and generalizes location', () => {
    const out = anonymize(sample, { ...DEFAULT_ANON_CONFIG, level: 'L2', ageBracket: 5, locationGranularity: 'ZONE', suppressionThreshold: 0 });
    expect(out[0]!.age).toBeUndefined();
    expect(out[0]!.ageBand).toBeDefined();
    expect(out[0]!.woreda).toBeNull();
    expect(out[0]!.zone).toBeDefined();
  });

  it('L2 top-codes income above threshold', () => {
    const out = anonymize(sample, { ...DEFAULT_ANON_CONFIG, level: 'L2', incomeTopCode: 50, suppressionThreshold: 0 });
    const incomes = out.map((r) => r.income as number).sort((a, b) => a - b);
    expect(incomes[incomes.length - 1]).toBeLessThanOrEqual(8000);
  });

  it('L3 aggregates with suppression', () => {
    const out = anonymize(sample, { ...DEFAULT_ANON_CONFIG, level: 'L3', suppressionThreshold: 2 });
    for (const row of out) {
      expect(row.panelId).toMatch(/^AGG-/);
      expect(row.count).toBeGreaterThanOrEqual(2);
    }
  });

  it('addNoise perturbs income values', () => {
    const out = anonymize(sample, { ...DEFAULT_ANON_CONFIG, level: 'L2', addNoise: true, suppressionThreshold: 0 });
    expect(out[0]!.income).not.toBe(3500);
    expect(out[0]!.income).toBeGreaterThan(3000);
    expect(out[0]!.income).toBeLessThan(4000);
  });
});

describe('toCsv', () => {
  it('returns empty for empty input', () => {
    expect(toCsv([])).toBe('');
  });

  it('escapes commas and quotes', () => {
    const csv = toCsv([{ panelId: 'P1', a: 'hello, world', b: 'she said "hi"' }]);
    expect(csv).toContain('"hello, world"');
    expect(csv).toContain('"she said ""hi"""');
  });
});