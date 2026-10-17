import type { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '@/lib/errors.js';
import { sendSuccess, sendCreated } from '@/lib/response.js';
import * as service from './beneficiary.service.js';
import type {
  RegisterBeneficiaryInput, DedupCheckInput, ListBeneficiariesQuery,
  VerifyBeneficiaryInput, MergeBeneficiaryInput,
  CreateDeliveryInput, ListDeliveriesQuery, VerifyDeliveryInput
} from './beneficiary.schemas.js';

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
    const query = (res.locals.query ?? req.query) as ListBeneficiariesQuery;
    const result = await service.listBeneficiaries(query, user.scope, user.orgId);
    sendSuccess(res, result.data, 200, result.pagination);
  } catch (err) { next(err); }
}

export async function getHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    sendSuccess(res, await service.getBeneficiary(req.params.id!));
  } catch (err) { next(err); }
}

export async function dedupHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    sendSuccess(res, await service.checkDuplicates(req.body as DedupCheckInput));
  } catch (err) { next(err); }
}

export async function registerHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = getUser(req);
    const data = await service.registerBeneficiary(
      req.body as RegisterBeneficiaryInput, user.userId, getCtx(req)
    );
    sendCreated(res, data);
  } catch (err) { next(err); }
}

export async function verifyHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = getUser(req);
    const data = await service.verifyBeneficiary(
      req.params.id!, req.body as VerifyBeneficiaryInput, user.userId, getCtx(req)
    );
    sendSuccess(res, data);
  } catch (err) { next(err); }
}

export async function mergeHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = getUser(req);
    const data = await service.mergeBeneficiary(
      req.params.id!, req.body as MergeBeneficiaryInput, user.userId, getCtx(req)
    );
    sendSuccess(res, data);
  } catch (err) { next(err); }
}

export async function listDeliveriesHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = getUser(req);
    const query = (res.locals.query ?? req.query) as ListDeliveriesQuery;
    const result = await service.listServiceDeliveries(
      query, user.scope, user.orgId, user.userId, user.role
    );
    sendSuccess(res, result.data, 200, result.pagination);
  } catch (err) { next(err); }
}

export async function createDeliveryHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = getUser(req);
    const data = await service.createServiceDelivery(
      req.body as CreateDeliveryInput, user.scope, user.orgId, user.userId, user.role, getCtx(req)
    );
    sendCreated(res, data);
  } catch (err) { next(err); }
}

export async function verifyDeliveryHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = getUser(req);
    const data = await service.verifyDelivery(
      req.params.id!, req.body as VerifyDeliveryInput, user.userId, getCtx(req)
    );
    sendSuccess(res, data);
  } catch (err) { next(err); }
}