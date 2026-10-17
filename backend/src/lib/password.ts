import argon2 from 'argon2';
import { authConfig } from '@/config/auth.config.js';

/**
 * Argon2id password hashing — the recommended password KDF.
 * Parameters tuned for ~50ms on modern hardware.
 */
const HASH_OPTIONS: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: 19_456,  // 19 MB
  timeCost: 2,
  parallelism: 1
};

export async function hashPassword(password: string): Promise<string> {
  validatePasswordStrength(password);
  return argon2.hash(password, HASH_OPTIONS);
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch {
    return false;
  }
}

export function needsRehash(hash: string): boolean {
  try {
    return argon2.needsRehash(hash, HASH_OPTIONS);
  } catch {
    return true;
  }
}

export interface PasswordStrengthError {
  code: string;
  message: string;
}

/**
 * Enforces the password policy defined in authConfig.
 * Throws with a specific code so the API can return field-level errors.
 */
export function validatePasswordStrength(password: string): void {
  const p = authConfig.password;

  if (password.length < p.minLength) {
    throw Object.assign(
      new Error(`Password must be at least ${p.minLength} characters`),
      { code: 'PASSWORD_TOO_SHORT' }
    );
  }
  if (password.length > p.maxLength) {
    throw Object.assign(
      new Error(`Password must be at most ${p.maxLength} characters`),
      { code: 'PASSWORD_TOO_LONG' }
    );
  }
  if (p.requireUppercase && !/[A-Z]/.test(password)) {
    throw Object.assign(
      new Error('Password must contain at least one uppercase letter'),
      { code: 'PASSWORD_NO_UPPERCASE' }
    );
  }
  if (p.requireLowercase && !/[a-z]/.test(password)) {
    throw Object.assign(
      new Error('Password must contain at least one lowercase letter'),
      { code: 'PASSWORD_NO_LOWERCASE' }
    );
  }
  if (p.requireDigit && !/\d/.test(password)) {
    throw Object.assign(
      new Error('Password must contain at least one digit'),
      { code: 'PASSWORD_NO_DIGIT' }
    );
  }
  if (p.requireSymbol && !/[^A-Za-z0-9]/.test(password)) {
    throw Object.assign(
      new Error('Password must contain at least one symbol'),
      { code: 'PASSWORD_NO_SYMBOL' }
    );
  }
}