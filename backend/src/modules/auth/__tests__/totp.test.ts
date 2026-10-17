import { describe, it, expect } from 'vitest';
import { generateTotpSecret, generateCurrentTotp, verifyTotp, generateTotpUri } from '@/lib/totp.js';

describe('TOTP', () => {
  it('generates a secret and verifies the current code', () => {
    const secret = generateTotpSecret();
    const code = generateCurrentTotp(secret);
    expect(code).toMatch(/^\d{6}$/);
    expect(verifyTotp(secret, code)).toBe(true);
  });

  it('rejects a wrong code', () => {
    const secret = generateTotpSecret();
    expect(verifyTotp(secret, '000000')).toBe(false);
  });

  it('produces a valid otpauth URI', () => {
    const secret = generateTotpSecret();
    const uri = generateTotpUri(secret, 'user@example.com', 'PIIMS');
    expect(uri).toMatch(/^otpauth:\/\/totp\//);
    expect(uri).toContain('secret=');
    expect(uri).toContain('issuer=PIIMS');
  });
});