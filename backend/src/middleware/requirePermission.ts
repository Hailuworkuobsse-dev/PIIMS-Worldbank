import type { Request, Response, NextFunction } from 'express';
import { hasPermission, hasAnyPermission, hasAllPermissions } from '@/lib/permissions.js';
import { ForbiddenError, UnauthorizedError } from '@/lib/errors.js';

/**
 * Require a single permission.
 *   router.get('/projects', requireAuth, requirePermission('project:read'), handler)
 */
export function requirePermission(permission: string) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(new UnauthorizedError());
    if (!hasPermission(req.user.permissions, permission)) {
      return next(new ForbiddenError(`Missing permission: ${permission}`));
    }
    next();
  };
}

/**
 * Require at least one of the given permissions.
 */
export function requireAnyPermission(permissions: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(new UnauthorizedError());
    if (!hasAnyPermission(req.user.permissions, permissions)) {
      return next(
        new ForbiddenError(`Requires one of: ${permissions.join(', ')}`)
      );
    }
    next();
  };
}

/**
 * Require all of the given permissions.
 */
export function requireAllPermissions(permissions: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(new UnauthorizedError());
    if (!hasAllPermissions(req.user.permissions, permissions)) {
      return next(
        new ForbiddenError(`Requires all: ${permissions.join(', ')}`)
      );
    }
    next();
  };
}

/**
 * Require a specific role (bypasses permission check — use sparingly).
 */
export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(new UnauthorizedError());
    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError(`Requires role: ${roles.join(' or ')}`));
    }
    next();
  };
}

/**
 * Require MFA to have been completed during this session.
 * Use for sensitive admin operations (user creation, role change, etc.).
 */
export function requireMfa(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) return next(new UnauthorizedError());
  if (!req.user.mfa) {
    return next(new ForbiddenError('MFA required for this operation'));
  }
  next();
}