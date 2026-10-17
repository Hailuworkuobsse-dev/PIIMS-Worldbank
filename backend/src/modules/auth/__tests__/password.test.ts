import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, validatePasswordStrength } from '@/lib/password.js';

describe('password', () => {
  it('hashes and verifies a valid password', async () => {
    const hash = await hashPassword('Demo1234');
    expect(hash).toMatch(/^\$argon2id\$/);
    expect(await verifyPassword(hash, 'Demo1234')).toBe(true);
    expect(await verifyPassword(hash, 'Wrong1234')).toBe(false);
  });

  it('rejects a too-short password', () => {
    expect(() => validatePasswordStrength('Demo1')).toThrow(/at least 8/);
  });

  it('rejects a password with no uppercase', () => {
    expect(() => validatePasswordStrength('demo1234')).toThrow(/uppercase/);
  });

  it('rejects a password with no digit', () => {
    expect(() => validatePasswordStrength('DemoDemo')).toThrow(/digit/);
  });

  it('accepts a compliant password', () => {
    expect(() => validatePasswordStrength('Demo1234')).not.toThrow();
  });
});