import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '@/lib/jwt.js';
import { UnauthorizedError, ForbiddenError } from '@/lib/errors.js';
import { roleRequiresMfa } from '@/config/auth.config.js';

/**
 * Verifies the Bearer token on the Authorization header, decodes the
 * user context, and attaches it to `req.user`.
 *
 * Downstream middleware and controllers can trust `req.user`.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  authenticate(req, next, false);
}

/** Permit password/MFA onboarding only; all other routes require completed MFA. */
export function requireAuthForOnboarding(req: Request, _res: Response, next: NextFunction): void {
  authenticate(req, next, true);
}

function authenticate(req: Request, next: NextFunction, allowMfaSetup: boolean): void {
  const header = req.header('authorization');
  if (!header) return next(new UnauthorizedError('Authorization header missing'));

  const [scheme, token] = header.split(' ');
  if (!scheme || !token || scheme.toLowerCase() !== 'bearer') {
    return next(new UnauthorizedError('Authorization must be "Bearer <token>"'));
  }

  try {
    const payload = verifyAccessToken(token);
    if (!allowMfaSetup && roleRequiresMfa(payload.role) && !payload.mfa) {
      return next(new ForbiddenError('Complete multi-factor authentication setup before accessing PIIMS.'));
    }
    req.user = {
      userId: payload.sub,
      username: payload.username,
      orgId: payload.orgId,
      role: payload.role,
      permissions: payload.permissions,
      scope: payload.scope,
      mfa: payload.mfa
    };
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Optional auth — attaches `req.user` if a valid token is present,
 * otherwise leaves it undefined and continues. Used for endpoints
 * that have different behavior when authenticated.
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.header('authorization');
  if (!header) return next();
  const [scheme, token] = header.split(' ');
  if (!scheme || !token || scheme.toLowerCase() !== 'bearer') return next();
  try {
    const payload = verifyAccessToken(token);
    req.user = {
      userId: payload.sub,
      username: payload.username,
      orgId: payload.orgId,
      role: payload.role,
      permissions: payload.permissions,
      scope: payload.scope,
      mfa: payload.mfa
    };
  } catch {
    /* ignore — treat as anonymous */
  }
  next();
}