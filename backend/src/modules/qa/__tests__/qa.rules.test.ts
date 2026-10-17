import { describe, it, expect } from 'vitest';
import { evaluateRules, haversineKm, type QASubmission, type QAContext } from '../qa.rules.js';

const baseCtx: QAContext = { medianDurationSeconds: 1800 };

const makeSubmission = (o: Partial<QASubmission> = {}): QASubmission => ({
  submissionId: 's1', collectorId: 'c1', durationSeconds: 1800,
  answers: [{ questionId: 'q1', value: 'a' }, { questionId: 'q2', value: 'b' }],
  ...o
});

describe('haversineKm', () => {
  it('returns 0 for identical points', () => {
    expect(haversineKm({ lat: 9, lon: 40 }, { lat: 9, lon: 40 })).toBeCloseTo(0, 5);
  });

  it('computes Addis to Adama distance', () => {
    const d = haversineKm({ lat: 9.03, lon: 38.74 }, { lat: 8.54, lon: 39.27 });
    expect(d).toBeGreaterThan(60);
    expect(d).toBeLessThan(100);
  });
});

describe('evaluateRules', () => {
  it('flags DURATION_SHORT when interview < 50% of median', () => {
    expect(evaluateRules(makeSubmission({ durationSeconds: 500 }), baseCtx).some((r) => r.ruleType === 'DURATION_SHORT')).toBe(true);
  });

  it('does NOT flag short when duration is normal', () => {
    expect(evaluateRules(makeSubmission({ durationSeconds: 1000 }), baseCtx).some((r) => r.ruleType === 'DURATION_SHORT')).toBe(false);
  });

  it('flags DURATION_LONG when interview > 3× median', () => {
    expect(evaluateRules(makeSubmission({ durationSeconds: 6000 }), baseCtx).some((r) => r.ruleType === 'DURATION_LONG')).toBe(true);
  });

  it('flags STRAIGHT_LINE for 15+ identical answers', () => {
    const answers = Array.from({ length: 20 }, (_, i) => ({ questionId: `q${i}`, value: 'same' }));
    expect(evaluateRules(makeSubmission({ answers }), baseCtx).some((r) => r.ruleType === 'STRAIGHT_LINE')).toBe(true);
  });

  it('does NOT flag straight-line for varied answers', () => {
    const answers = Array.from({ length: 20 }, (_, i) => ({ questionId: `q${i}`, value: `v${i}` }));
    expect(evaluateRules(makeSubmission({ answers }), baseCtx).some((r) => r.ruleType === 'STRAIGHT_LINE')).toBe(false);
  });

  it('flags GPS_OUTSIDE when > 5 km from assigned', () => {
    expect(evaluateRules(makeSubmission({
      gpsStart: { lat: 9.5, lon: 40.5 },
      assignedLocation: { lat: 9.03, lon: 38.74 }
    }), baseCtx).some((r) => r.ruleType === 'GPS_OUTSIDE')).toBe(true);
  });

  it('flags OUTLIER for z-score > 3', () => {
    expect(evaluateRules(makeSubmission({
      answers: [{ questionId: 'income', value: 50000 }]
    }), {
      ...baseCtx,
      numericMean: { income: 5000 },
      numericSD: { income: 3000 }
    }).some((r) => r.ruleType === 'OUTLIER')).toBe(true);
  });

  it('returns empty array for clean submission', () => {
    expect(evaluateRules(makeSubmission({ durationSeconds: 1800 }), baseCtx)).toEqual([]);
  });
});