import type { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '@/lib/errors.js';
import { sendSuccess, sendCreated } from '@/lib/response.js';
import * as service from './financial.service.js';
import type {
  CreateBudgetInput, ListBudgetsQuery,
  CreateDisbursementInput, ListDisbursementsQuery,
  ExecutionQuery, FmisSyncInput, CostPerOutputQuery, ExceptionsQuery
} from './financial.schemas.js';

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

export async function listBudgetsHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = getUser(req);
    const query = (res.locals.query ?? req.query) as ListBudgetsQuery;
    const data = await service.listBudgets(query, user.scope, user.orgId, user.userId);
    sendSuccess(res, data);
  } catch (err) { next(err); }
}

export async function createBudgetHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = getUser(req);
    const data = await service.createBudget(
      req.body as CreateBudgetInput, user.scope, user.orgId, user.userId, getCtx(req)
    );
    sendCreated(res, data);
  } catch (err) { next(err); }
}

export async function listDisbursementsHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = getUser(req);
    const query = (res.locals.query ?? req.query) as ListDisbursementsQuery;
    const result = await service.listDisbursements(query, user.scope, user.orgId, user.userId);
    sendSuccess(res, result.data, 200, result.pagination);
  } catch (err) { next(err); }
}

export async function createDisbursementHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = getUser(req);
    const data = await service.createDisbursement(
      req.body as CreateDisbursementInput, user.scope, user.orgId, user.userId, getCtx(req)
    );
    sendCreated(res, data);
  } catch (err) { next(err); }
}

export async function executionHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = getUser(req);
    const query = (res.locals.query ?? req.query) as ExecutionQuery;
    const data = await service.getExecution(query, user.scope, user.orgId, user.userId);
    sendSuccess(res, data);
  } catch (err) { next(err); }
}

export async function triggerFmisSyncHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = getUser(req);
    const input = (res.locals.body ?? req.body) as FmisSyncInput;
    const data = await service.triggerFmisSync(input, user.userId, getCtx(req));
    sendSuccess(res, data, 202);
  } catch (err) { next(err); }
}

export async function fmisRunsHandler(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await service.listFmisRuns();
    sendSuccess(res, data);
  } catch (err) { next(err); }
}

export async function costPerOutputHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = getUser(req);
    const query = (res.locals.query ?? req.query) as CostPerOutputQuery;
    const data = await service.getCostPerOutput(query, user.scope, user.orgId, user.userId);
    sendSuccess(res, data);
  } catch (err) { next(err); }
}

export async function exceptionsHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = getUser(req);
    const query = (res.locals.query ?? req.query) as ExceptionsQuery;
    const data = await service.getExceptions(query, user.scope, user.orgId, user.userId);
    sendSuccess(res, data);
  } catch (err) { next(err); }
}