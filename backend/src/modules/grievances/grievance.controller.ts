import type { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '@/lib/errors.js';
import { sendSuccess, sendCreated } from '@/lib/response.js';
import * as service from './grievance.service.js';
import type {
  CreateGrievanceInput, ListGrievancesQuery,
  AssignInput, ResolveInput, EscalateInput, StatsQuery
} from './grievance.schemas.js';

function getCtx(req: Request) {
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

export async function listHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = getUser(req);
    const query = (res.locals.query ?? req.query) as ListGrievancesQuery;
    const result = await service.listGrievances(query, user.scope, user.orgId, user.userId);
    sendSuccess(res, result.data, 200, result.pagination);
  } catch (err) { next(err); }
}

export async function getHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendSuccess(res, await service.getGrievance(req.params.id!)); }
  catch (err) { next(err); }
}

export async function createHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = getUser(req);
    sendCreated(res, await service.createGrievance(req.body as CreateGrievanceInput, user.userId, getCtx(req)));
  } catch (err) { next(err); }
}

export async function assignHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = getUser(req);
    const data = await service.assignGrievance(req.params.id!, req.body as AssignInput, user.userId, getCtx(req));
    sendSuccess(res, data);
  } catch (err) { next(err); }
}

export async function resolveHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = getUser(req);
    const data = await service.resolveGrievance(req.params.id!, req.body as ResolveInput, user.userId, getCtx(req));
    sendSuccess(res, data);
  } catch (err) { next(err); }
}

export async function escalateHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = getUser(req);
    const data = await service.escalateGrievance(req.params.id!, req.body as EscalateInput, user.userId, getCtx(req));
    sendSuccess(res, data);
  } catch (err) { next(err); }
}

export async function actionsHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendSuccess(res, await service.listGrievanceActions(req.params.id!)); }
  catch (err) { next(err); }
}

export async function statsHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = (res.locals.query ?? req.query) as StatsQuery;
    sendSuccess(res, await service.getStats(query));
  } catch (err) { next(err); }
}