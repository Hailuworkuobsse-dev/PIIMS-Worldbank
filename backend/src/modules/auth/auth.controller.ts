import type { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service.js';
import { sendSuccess, sendNoContent } from '@/lib/response.js';
import { UnauthorizedError } from '@/lib/errors.js';
import type { LoginInput, MfaVerifyInput, RefreshInput, ChangePasswordInput, MfaEnableInput, MfaDisableInput } from './auth.schemas.js';

function contextFrom(req: Request) {
  return {
    ipAddress: req.ip ?? null,
    userAgent: req.header('user-agent') ?? null,
    correlationId: (res_locals(req) as string | undefined) ?? null
  };
}

function res_locals(req: Request): unknown {
  return (req.res?.locals as Record<string, unknown>)?.correlationId;
}

function requireUser(req: Request) {
  if (!req.user) throw new UnauthorizedError();
  return req.user;
}

/* ════════════════════════════════════════════════════════════════════
 * POST /auth/login
 * ════════════════════════════════════════════════════════════════════ */

export async function loginHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { username, password } = req.body as LoginInput;
    const result = await authService.login(username, password, contextFrom(req));
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

/* ════════════════════════════════════════════════════════════════════
 * POST /auth/mfa/verify
 * ════════════════════════════════════════════════════════════════════ */

export async function mfaVerifyHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { mfa_token, mfa_code } = req.body as MfaVerifyInput;
    const result = await authService.verifyMfaAndLogin(mfa_token, mfa_code, contextFrom(req));
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

/* ════════════════════════════════════════════════════════════════════
 * POST /auth/refresh
 * ════════════════════════════════════════════════════════════════════ */

export async function refreshHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { refresh_token } = req.body as RefreshInput;
    const result = await authService.refresh(refresh_token, contextFrom(req));
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

/* ════════════════════════════════════════════════════════════════════
 * POST /auth/logout
 * ════════════════════════════════════════════════════════════════════ */

export async function logoutHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = requireUser(req);
    const body = (req.body ?? {}) as { refresh_token?: string };
    await authService.logout(user.userId, body.refresh_token, contextFrom(req));
    sendNoContent(res);
  } catch (err) {
    next(err);
  }
}

/* ════════════════════════════════════════════════════════════════════
 * GET /auth/me
 * ════════════════════════════════════════════════════════════════════ */

export async function meHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = requireUser(req);
    const me = await authService.getMe(user.userId);
    sendSuccess(res, me);
  } catch (err) {
    next(err);
  }
}

/* ════════════════════════════════════════════════════════════════════
 * POST /auth/change-password
 * ════════════════════════════════════════════════════════════════════ */

export async function changePasswordHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = requireUser(req);
    const { old_password, new_password } = req.body as ChangePasswordInput;
    await authService.changePassword(user.userId, old_password, new_password, contextFrom(req));
    sendNoContent(res);
  } catch (err) {
    next(err);
  }
}

/* ════════════════════════════════════════════════════════════════════
 * POST /auth/mfa/setup
 * ════════════════════════════════════════════════════════════════════ */

export async function mfaSetupHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = requireUser(req);
    const result = await authService.setupMfa(user.userId);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

/* ════════════════════════════════════════════════════════════════════
 * POST /auth/mfa/enable
 * ════════════════════════════════════════════════════════════════════ */

export async function mfaEnableHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = requireUser(req);
    const { mfa_code } = req.body as MfaEnableInput;
    await authService.enableMfa(user.userId, mfa_code, contextFrom(req));
    sendSuccess(res, { enabled: true });
  } catch (err) {
    next(err);
  }
}

/* ════════════════════════════════════════════════════════════════════
 * POST /auth/mfa/disable
 * ════════════════════════════════════════════════════════════════════ */

export async function mfaDisableHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = requireUser(req);
    const { password } = req.body as MfaDisableInput;
    await authService.disableMfa(user.userId, password, contextFrom(req));
    sendNoContent(res);
  } catch (err) {
    next(err);
  }
}