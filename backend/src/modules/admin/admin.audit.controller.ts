import type { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '@/lib/response.js';
import * as service from './admin.audit.service.js';
import type { ListAuditQuery } from './admin.schemas.js';

export async function listAuditHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const query = (res.locals.query ?? req.query) as ListAuditQuery;
    const result = await service.listAuditLogs(query);
    sendSuccess(res, result.data, 200, result.pagination);
  } catch (err) {
    next(err);
  }
}