import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CircuitBreaker } from '../utils/circuit-breaker.js';

describe('CircuitBreaker', () => {
  let breaker: CircuitBreaker;

  beforeEach(() => {
    breaker = new CircuitBreaker({ failureThreshold: 3, successThreshold: 2, openDurationMs: 100 });
  });

  it('passes through when closed', async () => {
    const result = await breaker.execute('svc', async () => 'ok');
    expect(result).toBe('ok');
  });

  it('opens after N consecutive failures', async () => {
    for (let i = 0; i < 3; i++) {
      await expect(breaker.execute('svc', async () => { throw new Error('fail'); })).rejects.toThrow();
    }
    expect(breaker.getState('svc').state).toBe('OPEN');
    await expect(breaker.execute('svc', async () => 'ok')).rejects.toThrow(/OPEN/);
  });

  it('half-opens after openDurationMs', async () => {
    for (let i = 0; i < 3; i++) {
      await expect(breaker.execute('svc', async () => { throw new Error('fail'); })).rejects.toThrow();
    }
    await new Promise((r) => setTimeout(r, 150));
    expect(breaker.getState('svc').state).toBe('HALF_OPEN');
  });

  it('closes after successThreshold successes in half-open', async () => {
    for (let i = 0; i < 3; i++) {
      await expect(breaker.execute('svc', async () => { throw new Error('fail'); })).rejects.toThrow();
    }
    await new Promise((r) => setTimeout(r, 150));
    await breaker.execute('svc', async () => 'ok');
    await breaker.execute('svc', async () => 'ok');
    expect(breaker.getState('svc').state).toBe('CLOSED');
  });

  it('resets failures on success', async () => {
    await expect(breaker.execute('svc', async () => { throw new Error('fail'); })).rejects.toThrow();
    await breaker.execute('svc', async () => 'ok');
    expect(breaker.getState('svc').failures).toBe(0);
  });

  it('isolates keys', async () => {
    for (let i = 0; i < 3; i++) {
      await expect(breaker.execute('svcA', async () => { throw new Error('fail'); })).rejects.toThrow();
    }
    expect(breaker.getState('svcA').state).toBe('OPEN');
    expect(breaker.getState('svcB').state).toBe('CLOSED');
    const result = await breaker.execute('svcB', async () => 'ok');
    expect(result).toBe('ok');
  });
});