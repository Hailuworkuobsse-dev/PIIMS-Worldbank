import { env, mfaRequiredRoles } from './env.js';

/**
 * Auth-related constants — single source of truth for token lifetimes,
 * MFA policy, and password rules.
 */
export const authConfig = {
  // ─── Token lifetimes (seconds) ─────────────────────────────────
  accessTokenTtlSeconds: parseDuration(env.JWT_ACCESS_EXPIRES_IN),   // 15 min
  refreshTokenTtlSeconds: parseDuration(env.JWT_REFRESH_EXPIRES_IN), // 8 h
  mfaChallengeTtlSeconds: 5 * 60,                                    // 5 min

  // ─── Token issuer/audience ─────────────────────────────────────
  issuer: 'piims',
  audience: 'piims-api',

  // ─── Password policy ───────────────────────────────────────────
  password: {
    minLength: 8,
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireDigit: true,
    requireSymbol: false
  },

  // ─── Account lockout ───────────────────────────────────────────
  maxFailedLogins: 5,
  lockoutDurationSeconds: 15 * 60,

  // ─── MFA ───────────────────────────────────────────────────────
  mfa: {
    issuer: env.MFA_ISSUER,
    window: 1,                      // accept ±30 s TOTP drift
    requiredRoles: mfaRequiredRoles  // roles that must have MFA
  },

  // ─── Refresh token rotation ────────────────────────────────────
  refreshRotation: true,

  // ─── Cleanup ───────────────────────────────────────────────────
  expiredTokenCleanupIntervalMs: 60 * 60 * 1000 // 1 h
} as const;

/**
 * Parse "15m", "8h", "30s" → seconds.
 */
function parseDuration(input: string): number {
  const match = input.match(/^(\d+)([smhd])$/);
  if (!match) throw new Error(`Invalid duration: ${input}`);
  const [, numStr, unit] = match;
  const num = Number(numStr);
  switch (unit) {
    case 's': return num;
    case 'm': return num * 60;
    case 'h': return num * 3600;
    case 'd': return num * 86400;
    default: throw new Error(`Invalid unit: ${unit}`);
  }
}

/**
 * True if the role requires MFA to be enabled.
 */
export function roleRequiresMfa(roleCode: string): boolean {
  return authConfig.mfa.requiredRoles.includes(roleCode);
}