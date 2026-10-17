import { describe, it, expect, beforeAll } from 'vitest';
import {
  signAccessToken, verifyAccessToken, signRefreshToken, verifyRefreshToken,
  signMfaChallenge, verifyMfaChallenge
} from '@/lib/jwt.js';

beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret-at-least-32-chars-long-aaaaaaaaaaaaaa';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-at-least-32-chars-long-bbbbbbbbbbbb';
  process.env.JWT_ACCESS_EXPIRES_IN = '15m';
  process.env.JWT_REFRESH_EXPIRES_IN = '8h';
});

describe('JWT', () => {
  it('signs and verifies an access token', () => {
    const scope = { orgLevel: 'FEDERAL' as const };
    const { token, jti } = signAccessToken(
      'user-1', 'user1', 'org-1', 'MW-PIU', ['project:read', 'project:write'], scope, false
    );
    const decoded = verifyAccessToken(token);
    expect(decoded.sub).toBe('user-1');
    expect(decoded.role).toBe('MW-PIU');
    expect(decoded.permissions).toContain('project:read');
    expect(decoded.mfa).toBe(false);
    expect(decoded.jti).toBe(jti);
  });

  it('rejects a tampered token', () => {
    const scope = { orgLevel: 'FEDERAL' as const };
    const { token } = signAccessToken('u', 'u', 'o', 'r', [], scope, false);
    const tampered = token.slice(0, -5) + 'xxxxx';
    expect(() => verifyAccessToken(tampered)).toThrow();
  });

  it('signs and verifies a refresh token', () => {
    const { token } = signRefreshToken('user-1');
    const decoded = verifyRefreshToken(token);
    expect(decoded.sub).toBe('user-1');
  });

  it('signs and verifies an MFA challenge', () => {
    const { token } = signMfaChallenge('user-1');
    const decoded = verifyMfaChallenge(token);
    expect(decoded.sub).toBe('user-1');
    expect(decoded.purpose).toBe('mfa-challenge');
  });
});