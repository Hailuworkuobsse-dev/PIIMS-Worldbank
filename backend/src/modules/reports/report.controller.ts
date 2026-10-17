import type { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '@/lib/errors.js';
import { sendSuccess, sendCreated, sendNoContent } from '@/lib/response.js';
import * as service from './report.service.js';
import type {
  GenerateReportInput, ScheduleReportInput, ListInstancesQuery
} from './report.schemas.js';

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

export async function catalogueHandler(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    sendSuccess(res, service.listCatalogue());
  } catch (err) { next(err); }
}

export async function generateHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = getUser(req);
    const input = req.body as GenerateReportInput;
    const data = await service.enqueueReport(
      input, user.scope, user.orgId, user.userId, getContext(req)
    );
    sendCreated(res, data);
  } catch (err) { next(err); }
}

export async function listInstancesHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = getUser(req);
    const query = (res.locals.query ?? req.query) as ListInstancesQuery;
    const result = await service.listInstances(query, user.scope, user.orgId);
    sendSuccess(res, result.data, 200, result.pagination);
  } catch (err) { next(err); }
}

export async function getInstanceHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await service.getInstance(req.params.id!);
    sendSuccess(res, data);
  } catch (err) { next(err); }
}

export async function downloadHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await service.getDownloadUrl(req.params.id!);
    sendSuccess(res, data);
  } catch (err) { next(err); }
}

export async function wbExportHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = getUser(req);
    const period = String(req.query.period ?? '');
    if (!period) {
      res.status(400).json({ error: 'period query parameter required' });
      return;
    }
    const projectIds = req.query.project_ids
      ? String(req.query.project_ids).split(',').filter(Boolean)
      : undefined;

    const data = await service.exportWb(period, projectIds, user.scope, user.orgId);
    sendSuccess(res, data);
  } catch (err) { next(err); }
}

export async function listSchedulesHandler(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    sendSuccess(res, await service.listSchedules());
  } catch (err) { next(err); }
}

export async function createScheduleHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = req.body as ScheduleReportInput;
    const data = await service.createSchedule(input);
    sendCreated(res, data);
  } catch (err) { next(err); }
}

export async function deleteScheduleHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await service.deleteSchedule(req.params.id!);
    sendNoContent(res);
  } catch (err) { next(err); }
}