import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import { env } from '@/config/env.js';
import { authConfig } from '@/config/auth.config.js';
import { UnauthorizedError } from '@/lib/errors.js';

/* ════════════════════════════════════════════════════════════════════
 * Token payload types
 * ════════════════════════════════════════════════════════════════════ */

export interface AccessTokenPayload {
  sub: string;          // userId
  username: string;
  orgId: string;
  role: string;
  permissions: string[];
  scope: ScopeClaim;
  mfa: boolean;         // MFA was satisfied during this session
  jti: string;
  iat: number;
  exp: number;
  iss: string;
  aud: string;
}

export interface RefreshTokenPayload {
  sub: string;          // userId
  jti: string;          // unique — matches the DB row
  iat: number;
  exp: number;
  iss: string;
  aud: string;
}

export interface MfaChallengePayload {
  sub: string;          // userId
  purpose: 'mfa-challenge';
  jti: string;
  iat: number;
  exp: number;
  iss: string;
  aud: string;
}

export interface ScopeClaim {
  orgLevel: 'FEDERAL' | 'REGIONAL' | 'ZONAL' | 'WOREDA' | 'KEBELE' | 'EXTERNAL';
  regions?: string[];
  zones?: string[];
  woredas?: string[];
  kebeles?: string[];
  ownRecordsOnly?: boolean;
}

/* ════════════════════════════════════════════════════════════════════
 * Sign
 * ════════════════════════════════════════════════════════════════════ */

export function signAccessToken(
  userId: string,
  username: string,
  orgId: string,
  role: string,
  permissions: string[],
  scope: ScopeClaim,
  mfa: boolean
): { token: string; jti: string; expiresIn: number } {
  const jti = randomUUID();
  const options: SignOptions = {
    expiresIn: authConfig.accessTokenTtlSeconds,
    issuer: authConfig.issuer,
    audience: authConfig.audience,
    subject: userId,
    jwtid: jti,
    algorithm: 'HS256'
  };

  const token = jwt.sign(
    { username, orgId, role, permissions, scope, mfa },
    env.JWT_SECRET,
    options
  );

  return { token, jti, expiresIn: authConfig.accessTokenTtlSeconds };
}

export function signRefreshToken(userId: string): {
  token: string;
  jti: string;
  expiresIn: number;
} {
  const jti = randomUUID();
  const options: SignOptions = {
    expiresIn: authConfig.refreshTokenTtlSeconds,
    issuer: authConfig.issuer,
    audience: authConfig.audience,
    jwtid: jti,
    algorithm: 'HS256'
  };

  const token = jwt.sign({}, env.JWT_REFRESH_SECRET, { ...options, subject: userId });

  return { token, jti, expiresIn: authConfig.refreshTokenTtlSeconds };
}

export function signMfaChallenge(userId: string): { token: string; expiresIn: number } {
  const options: SignOptions = {
    expiresIn: authConfig.mfaChallengeTtlSeconds,
    issuer: authConfig.issuer,
    audience: authConfig.audience,
    jwtid: randomUUID(),
    algorithm: 'HS256'
  };

  const token = jwt.sign({ purpose: 'mfa-challenge' }, env.JWT_SECRET, {
    ...options,
    subject: userId
  });

  return { token, expiresIn: authConfig.mfaChallengeTtlSeconds };
}

/* ════════════════════════════════════════════════════════════════════
 * Verify
 * ════════════════════════════════════════════════════════════════════ */

export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET, {
      issuer: authConfig.issuer,
      audience: authConfig.audience,
      algorithms: ['HS256']
    }) as jwt.JwtPayload;

    if (!decoded.sub || !decoded.jti) throw new Error('Missing sub or jti');

    return {
      sub: decoded.sub,
      username: decoded.username as string,
      orgId: decoded.orgId as string,
      role: decoded.role as string,
      permissions: (decoded.permissions as string[]) ?? [],
      scope: decoded.scope as ScopeClaim,
      mfa: Boolean(decoded.mfa),
      jti: decoded.jti,
      iat: decoded.iat!,
      exp: decoded.exp!,
      iss: decoded.iss!,
      aud: decoded.aud as string
    };
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError('Access token expired');
    }
    throw new UnauthorizedError('Invalid access token');
  }
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET, {
      issuer: authConfig.issuer,
      audience: authConfig.audience,
      algorithms: ['HS256']
    }) as jwt.JwtPayload;

    if (!decoded.sub || !decoded.jti) throw new Error('Missing sub or jti');

    return {
      sub: decoded.sub,
      jti: decoded.jti,
      iat: decoded.iat!,
      exp: decoded.exp!,
      iss: decoded.iss!,
      aud: decoded.aud as string
    };
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError('Refresh token expired');
    }
    throw new UnauthorizedError('Invalid refresh token');
  }
}

export function verifyMfaChallenge(token: string): MfaChallengePayload {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET, {
      issuer: authConfig.issuer,
      audience: authConfig.audience,
      algorithms: ['HS256']
    }) as jwt.JwtPayload;

    if (decoded.purpose !== 'mfa-challenge') {
      throw new Error('Not an MFA challenge token');
    }
    if (!decoded.sub || !decoded.jti) throw new Error('Missing sub or jti');

    return {
      sub: decoded.sub,
      purpose: 'mfa-challenge',
      jti: decoded.jti,
      iat: decoded.iat!,
      exp: decoded.exp!,
      iss: decoded.iss!,
      aud: decoded.aud as string
    };
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError('MFA challenge expired');
    }
    throw new UnauthorizedError('Invalid MFA challenge');
  }
}