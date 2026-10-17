import { describe, it, expect } from 'vitest';
import { computeSlaDue, slaDaysRemaining, isTerminalStatus } from '../grievance.utils.js';

describe('computeSlaDue', () => {
  const from = new Date('2026-10-01T00:00:00Z');

  it('CRITICAL = +24h', () => {
    const due = computeSlaDue('CRITICAL', from);
    expect(due.getTime() - from.getTime()).toBe(24 * 3600 * 1000);
  });

  it('HIGH = +72h', () => {
    const due = computeSlaDue('HIGH', from);
    expect(due.getTime() - from.getTime()).toBe(72 * 3600 * 1000);
  });

  it('MEDIUM = +7d', () => {
    const due = computeSlaDue('MEDIUM', from);
    expect(due.getTime() - from.getTime()).toBe(7 * 24 * 3600 * 1000);
  });

  it('LOW = +14d', () => {
    const due = computeSlaDue('LOW', from);
    expect(due.getTime() - from.getTime()).toBe(14 * 24 * 3600 * 1000);
  });
});

describe('slaDaysRemaining', () => {
  it('positive for future SLA', () => {
    const future = new Date(Date.now() + 3 * 24 * 3600 * 1000);
    expect(slaDaysRemaining(future)).toBeGreaterThanOrEqual(2);
  });

  it('negative for past SLA', () => {
    const past = new Date(Date.now() - 3 * 24 * 3600 * 1000);
    expect(slaDaysRemaining(past)).toBeLessThanOrEqual(-2);
  });
});

describe('isTerminalStatus', () => {
  it('true for RESOLVED and CLOSED', () => {
    expect(isTerminalStatus('RESOLVED')).toBe(true);
    expect(isTerminalStatus('CLOSED')).toBe(true);
  });
  it('false for others', () => {
    expect(isTerminalStatus('OPEN')).toBe(false);
    expect(isTerminalStatus('IN_PROGRESS')).toBe(false);
    expect(isTerminalStatus('ESCALATED')).toBe(false);
  });
});