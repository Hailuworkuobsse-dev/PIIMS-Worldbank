import type { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '@/lib/errors.js';
import { sendSuccess, sendCreated } from '@/lib/response.js';
import { requireUploadedFile } from '@/lib/upload.js';
import * as service from './inception.service.js';
import type {
  SubmitInceptionInput, ReviewDecisionInput, NoObjectionInput,
  AddCommentInput, ListReportsQuery
} from './inception.schemas.js';

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
    const query = (res.locals.query ?? req.query) as ListReportsQuery;
    const result = await service.listReports(query, user.scope, user.orgId, user.userId);
    sendSuccess(res, result.data, 200, result.pagination);
  } catch (err) { next(err); }
}

export async function getHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await service.getReport(req.params.id!);
    sendSuccess(res, data);
  } catch (err) { next(err); }
}

export async function templatesHandler(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    sendSuccess(res, service.listTemplates());
  } catch (err) { next(err); }
}

export async function submitHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = getUser(req);
    const file = requireUploadedFile(req);
    const input = (res.locals.body ?? req.body) as SubmitInceptionInput;
    const data = await service.submitReport(
      input, file, user.scope, user.orgId, user.userId, getContext(req)
    );
    sendCreated(res, data);
  } catch (err) { next(err); }
}

export async function reviewHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = getUser(req);
    const input = req.body as ReviewDecisionInput;
    const data = await service.reviewReport(req.params.id!, input, user.userId, getContext(req));
    sendSuccess(res, data);
  } catch (err) { next(err); }
}

export async function noObjectionHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = getUser(req);
    const input = req.body as NoObjectionInput;
    const data = await service.recordNoObjection(req.params.id!, input, user.userId, getContext(req));
    sendSuccess(res, data);
  } catch (err) { next(err); }
}

export async function commentsListHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await service.listComments(req.params.id!);
    sendSuccess(res, data);
  } catch (err) { next(err); }
}

export async function commentCreateHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = getUser(req);
    const input = req.body as AddCommentInput;
    const data = await service.addComment(req.params.id!, input, user.userId);
    sendCreated(res, data);
  } catch (err) { next(err); }
}

export async function commentResolveHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = getUser(req);
    const data = await service.resolveComment(req.params.id!, req.params.commentId!, user.userId);
    sendSuccess(res, data);
  } catch (err) { next(err); }
}

export async function versionsHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await service.listVersions(req.params.projectId!);
    sendSuccess(res, data);
  } catch (err) { next(err); }
}

export async function downloadHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await service.getDownloadUrl(req.params.id!);
    sendSuccess(res, data);
  } catch (err) { next(err); }
}