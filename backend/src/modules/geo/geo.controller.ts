import type { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '@/lib/errors.js';
import { sendSuccess } from '@/lib/response.js';
import * as service from './geo.service.js';
import type { MarkersQuery, GeoVerifyInput } from './geo.schemas.js';

function getUser(req: Request) {
  if (!req.user) throw new UnauthorizedError();
  return req.user;
}

export async function beneficiaryMarkersHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = getUser(req);
    const query = (res.locals.query ?? req.query) as MarkersQuery;
    sendSuccess(res, await service.getBeneficiaryMarkers(query, user.scope));
  } catch (err) { next(err); }
}

export async function interventionsHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = getUser(req);
    const query = (res.locals.query ?? req.query) as MarkersQuery;
    sendSuccess(res, await service.getInterventionMarkers(query, user.scope, user.orgId, user.userId));
  } catch (err) { next(err); }
}

export async function verifyHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    sendSuccess(res, await service.verifyGeo(req.body as GeoVerifyInput));
  } catch (err) { next(err); }
}