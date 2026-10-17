import { describe, it, expect, vi } from 'vitest';
import { retry, isTransientError } from '../utils/retry.js';

describe('retry', () => {
  it('returns result on first success', async () => {
    const fn = vi.fn().mockResolvedValue('ok');
    const result = await retry(fn, { attempts: 3, baseDelayMs: 1 });
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries until success', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail1'))
      .mockRejectedValueOnce(new Error('fail2'))
      .mockResolvedValueOnce('ok');
    const result = await retry(fn, { attempts: 3, baseDelayMs: 1 });
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('throws after max attempts', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('always fails'));
    await expect(retry(fn, { attempts: 2, baseDelayMs: 1 })).rejects.toThrow('always fails');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('stops retrying if retryIf returns false', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('permanent'));
    await expect(
      retry(fn, { attempts: 5, baseDelayMs: 1, retryIf: () => false })
    ).rejects.toThrow('permanent');
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe('isTransientError', () => {
  it('identifies timeout', () => {
    expect(isTransientError({ code: 'ETIMEDOUT' })).toBe(true);
    expect(isTransientError({ code: 'ECONNREFUSED' })).toBe(true);
  });

  it('identifies 5xx', () => {
    expect(isTransientError({ response: { status: 500 } })).toBe(true);
    expect(isTransientError({ response: { status: 503 } })).toBe(true);
  });

  it('identifies 429', () => {
    expect(isTransientError({ response: { status: 429 } })).toBe(true);
  });

  it('does NOT flag 4xx', () => {
    expect(isTransientError({ response: { status: 400 } })).toBe(false);
    expect(isTransientError({ response: { status: 404 } })).toBe(false);
  });
});