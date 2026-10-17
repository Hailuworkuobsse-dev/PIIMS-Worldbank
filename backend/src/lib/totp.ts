import { authenticator } from 'otplib';
import { authConfig } from '@/config/auth.config.js';

/**
 * TOTP (RFC 6238) — time-based one-time passwords for MFA.
 * Compatible with Google Authenticator, Authy, Microsoft Authenticator, etc.
 */
authenticator.options = {
  window: authConfig.mfa.window,
  step: 30,
  digits: 6
};

export function generateTotpSecret(): string {
  return authenticator.generateSecret(); // base32
}

export function generateTotpUri(secret: string, accountName: string, issuer: string): string {
  return authenticator.keyuri(accountName, issuer, secret);
}

export function verifyTotp(secret: string, code: string): boolean {
  try {
    return authenticator.verify({ token: code.replace(/\s+/g, ''), secret });
  } catch {
    return false;
  }
}

export function generateCurrentTotp(secret: string): string {
  return authenticator.generate(secret);
}