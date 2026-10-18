import type { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '@/lib/errors.js';
import { sendSuccess, sendCreated } from '@/lib/response.js';
import * as usersService from './admin.users.service.js';
import type { CreateUserInput, UpdateUserInput, ListUsersQuery } from './admin.schemas.js';

function getContext(req: Request) {
  return {
    ipAddress: req.ip ?? null,
    userAgent: req.header('user-agent') ?? null,
    correlationId: (req.res?.locals?.correlationId as string | undefined) ?? null
  };
}

function getUser(req: Request) {
  if (!req.user) throw new UnauthorizedError();
  return req.user;
}

export async function listUsersHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const query = (res.locals.query ?? req.query) as ListUsersQuery;
    const result = await usersService.listUsers(query);
    sendSuccess(res, result.data, 200, result.pagination);
  } catch (err) {
    next(err);
  }
}

export async function getUserHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = await usersService.getUserById(req.params.id!);
    sendSuccess(res, user);
  } catch (err) {
    next(err);
  }
}

export async function createUserHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const actor = getUser(req);
    const input = req.body as CreateUserInput;
    const result = await usersService.createUser(
      input,
      { userId: actor.userId, scope: actor.scope },
      getContext(req)
    );
    sendCreated(res, result);
  } catch (err) {
    next(err);
  }
}

export async function updateUserHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const actor = getUser(req);
    const input = req.body as UpdateUserInput;
    const result = await usersService.updateUser(
      req.params.id!,
      input,
      { userId: actor.userId, scope: actor.scope },
      getContext(req)
    );
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function resetPasswordHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const actor = getUser(req);
    const result = await usersService.resetPassword(
      req.params.id!,
      { userId: actor.userId, scope: actor.scope },
      getContext(req)
    );
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function deactivateUserHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const actor = getUser(req);
    const reason = (req.body as { reason?: string }).reason;
    const result = await usersService.deactivateUser(
      req.params.id!,
      reason,
      { userId: actor.userId, scope: actor.scope },
      getContext(req)
    );
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function reactivateUserHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const actor = getUser(req);
    const result = await usersService.reactivateUser(
      req.params.id!,
      { userId: actor.userId, scope: actor.scope },
      getContext(req)
    );
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}