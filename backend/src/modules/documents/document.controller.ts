import type { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '@/lib/errors.js';
import { sendSuccess, sendCreated, sendNoContent } from '@/lib/response.js';
import { requireUploadedFile } from '@/lib/upload.js';
import * as service from './document.service.js';
import type { UploadDocumentInput, ListDocumentsQuery } from './document.schemas.js';

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

export async function listHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = getUser(req);
    const query = (res.locals.query ?? req.query) as ListDocumentsQuery;
    const result = await service.listDocuments(query, user.scope, user.orgId, user.userId);
    sendSuccess(res, result.data, 200, result.pagination);
  } catch (err) { next(err); }
}

export async function getHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await service.getDocument(req.params.id!);
    sendSuccess(res, data);
  } catch (err) { next(err); }
}

export async function uploadHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = getUser(req);
    const file = requireUploadedFile(req);
    const input = (res.locals.body ?? req.body) as UploadDocumentInput;
    const data = await service.uploadDocument(
      input, file, user.scope, user.orgId, user.userId, getContext(req)
    );
    sendCreated(res, data);
  } catch (err) { next(err); }
}

export async function versionsHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await service.listVersions(req.params.id!);
    sendSuccess(res, data);
  } catch (err) { next(err); }
}

export async function restoreHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = getUser(req);
    const { version_id } = req.body as { version_id: string };
    const data = await service.restoreVersion(req.params.id!, version_id, user.userId, getContext(req));
    sendSuccess(res, data);
  } catch (err) { next(err); }
}

export async function downloadHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = getUser(req);
    const data = await service.getSignedUrl(req.params.id!, user.scope, user.orgId, user.userId);
    sendSuccess(res, data);
  } catch (err) { next(err); }
}