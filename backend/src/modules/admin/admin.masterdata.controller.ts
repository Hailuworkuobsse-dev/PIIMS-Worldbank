import type { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '@/lib/errors.js';
import { sendSuccess, sendCreated, sendNoContent } from '@/lib/response.js';
import * as service from './admin.masterdata.service.js';
import type {
  CreateMasterDataInput, UpdateMasterDataInput, ListMasterDataQuery
} from './admin.schemas.js';

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

export async function listHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const query = (res.locals.query ?? req.query) as ListMasterDataQuery;
    const data = await service.listMasterData(query);
    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
}

export async function createHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const actor = getUser(req);
    const input = req.body as CreateMasterDataInput;
    const data = await service.createMasterData(input, { userId: actor.userId }, getContext(req));
    sendCreated(res, data);
  } catch (err) {
    next(err);
  }
}

export async function updateHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const actor = getUser(req);
    const input = req.body as UpdateMasterDataInput;
    const data = await service.updateMasterData(
      req.params.id!, input, { userId: actor.userId }, getContext(req)
    );
    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
}

export async function deleteHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const actor = getUser(req);
    await service.deleteMasterData(req.params.id!, { userId: actor.userId }, getContext(req));
    sendNoContent(res);
  } catch (err) {
    next(err);
  }
}