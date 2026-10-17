import type { Request, Response, NextFunction } from 'express';
import { UnauthorizedError, BadRequestError } from '@/lib/errors.js';
import { sendSuccess } from '@/lib/response.js';
import * as service from './integration.service.js';
import type { RunsQuery, SyncTriggerInput } from './integration.schemas.js';
import type { IntegrationCode } from './integration.types.js';

function getUser(req: Request) {
  if (!req.user) throw new UnauthorizedError();
  return req.user;
}

export async function statusHandler(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    sendSuccess(res, await service.listIntegrationStatus());
  } catch (err) { next(err); }
}

export async function metadataHandler(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    sendSuccess(res, service.getIntegrationMetadata());
  } catch (err) { next(err); }
}

export async function triggerHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = getUser(req);
    const body = req.body as SyncTriggerInput;
    const result = await service.triggerSync(
      body.integrationCode as IntegrationCode,
      body.kind,
      user.userId
    );
    sendSuccess(res, result, 202);
  } catch (err) { next(err); }
}

export async function runsHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const code = req.params.code as IntegrationCode | undefined;
    if (code && !/^[A-Z_]+$/.test(code)) throw new BadRequestError('Invalid integration code');
    const query = (res.locals.query ?? req.query) as RunsQuery;
    sendSuccess(res, await service.listRuns(code, query));
  } catch (err) { next(err); }
}