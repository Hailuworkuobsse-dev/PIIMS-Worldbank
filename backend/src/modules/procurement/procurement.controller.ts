import type { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '@/lib/errors.js';
import { sendSuccess, sendCreated } from '@/lib/response.js';
import * as service from './procurement.service.js';
import type {
  CreateProcurementInput, UpdateProcurementInput, ListProcurementQuery,
  CreateContractInput, UpdateContractInput, ListContractsQuery,
  DelaysQuery
} from './procurement.schemas.js';

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

/* ─── Procurement ────────────────────────────────────────────────── */

export async function listProcurementHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = getUser(req);
    const query = (res.locals.query ?? req.query) as ListProcurementQuery;
    const result = await service.listProcurement(query, user.scope, user.orgId, user.userId);
    sendSuccess(res, result.data, 200, result.pagination);
  } catch (err) { next(err); }
}

export async function createProcurementHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = getUser(req);
    const data = await service.createProcurement(
      req.body as CreateProcurementInput, user.scope, user.orgId, user.userId, getCtx(req)
    );
    sendCreated(res, data);
  } catch (err) { next(err); }
}

export async function updateProcurementHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = getUser(req);
    const data = await service.updateProcurement(
      req.params.id!, req.body as UpdateProcurementInput,
      user.scope, user.orgId, user.userId, getCtx(req)
    );
    sendSuccess(res, data);
  } catch (err) { next(err); }
}

/* ─── Contracts ──────────────────────────────────────────────────── */

export async function listContractsHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = getUser(req);
    const query = (res.locals.query ?? req.query) as ListContractsQuery;
    const result = await service.listContracts(query, user.scope, user.orgId, user.userId);
    sendSuccess(res, result.data, 200, result.pagination);
  } catch (err) { next(err); }
}

export async function createContractHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = getUser(req);
    const data = await service.createContract(
      req.body as CreateContractInput, user.scope, user.orgId, user.userId, getCtx(req)
    );
    sendCreated(res, data);
  } catch (err) { next(err); }
}

export async function updateContractHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = getUser(req);
    const data = await service.updateContract(
      req.params.id!, req.body as UpdateContractInput,
      user.scope, user.orgId, user.userId, getCtx(req)
    );
    sendSuccess(res, data);
  } catch (err) { next(err); }
}

/* ─── Delays ─────────────────────────────────────────────────────── */

export async function delaysHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = getUser(req);
    const query = (res.locals.query ?? req.query) as DelaysQuery;
    const data = await service.listDelays(query, user.scope, user.orgId, user.userId);
    sendSuccess(res, data);
  } catch (err) { next(err); }
}

/* ─── Supplier performance ──────────────────────────────────────── */

export async function supplierPerformanceHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await service.getSupplierPerformance(req.params.supplierId!);
    sendSuccess(res, data);
  } catch (err) { next(err); }
}