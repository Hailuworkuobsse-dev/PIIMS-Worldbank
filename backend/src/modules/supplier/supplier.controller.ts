import type { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '@/lib/errors.js';
import { sendSuccess, sendCreated } from '@/lib/response.js';
import { requireUploadedFile } from '@/lib/upload.js';
import * as service from './supplier.service.js';
import type { UpdateProfileInput, SubmitDeliveryInput, UploadInvoiceInput } from './supplier.schemas.js';

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

export async function getProfileHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = getUser(req);
    sendSuccess(res, await service.getMyProfile(user.orgId));
  } catch (err) { next(err); }
}

export async function updateProfileHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = getUser(req);
    const data = await service.updateMyProfile(req.body as UpdateProfileInput, user.orgId, user.userId, getCtx(req));
    sendSuccess(res, data);
  } catch (err) { next(err); }
}

export async function listContractsHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = getUser(req);
    sendSuccess(res, await service.listMyContracts(user.orgId));
  } catch (err) { next(err); }
}

export async function listDeliveriesHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = getUser(req);
    const contractId = typeof req.query.contract_id === 'string' ? req.query.contract_id : undefined;
    sendSuccess(res, await service.listMyDeliveries(user.orgId, contractId));
  } catch (err) { next(err); }
}

export async function submitDeliveryHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = getUser(req);
    const data = await service.submitDelivery(
      (res.locals.body ?? req.body) as SubmitDeliveryInput,
      user.orgId, user.userId, getCtx(req)
    );
    sendCreated(res, data);
  } catch (err) { next(err); }
}

export async function listInvoicesHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = getUser(req);
    sendSuccess(res, await service.listMyInvoices(user.orgId));
  } catch (err) { next(err); }
}

export async function uploadInvoiceHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = getUser(req);
    const file = requireUploadedFile(req);
    const data = await service.uploadInvoice(
      (res.locals.body ?? req.body) as UploadInvoiceInput,
      file, user.orgId, user.userId, getCtx(req)
    );
    sendCreated(res, data);
  } catch (err) { next(err); }
}

export async function listWarrantiesHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = getUser(req);
    sendSuccess(res, await service.listMyWarranties(user.orgId));
  } catch (err) { next(err); }
}

export async function listPaymentsHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = getUser(req);
    sendSuccess(res, await service.listMyPayments(user.orgId));
  } catch (err) { next(err); }
}

export async function dashboardHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = getUser(req);
    sendSuccess(res, await service.getDashboard(user.orgId));
  } catch (err) { next(err); }
}