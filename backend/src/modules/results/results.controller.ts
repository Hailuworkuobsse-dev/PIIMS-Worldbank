import type { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '@/lib/errors.js';
import { sendSuccess, sendCreated } from '@/lib/response.js';
import * as service from './results.service.js';
import type {
  CreateComponentInput, UpdateComponentInput,
  CreateSubcomponentInput, UpdateSubcomponentInput,
  CreateIndicatorInput, UpdateIndicatorInput,
  ListIndicatorsQuery, RecordValueInput, AggregateQuery
} from './results.schemas.js';

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

/* ─── Components ─────────────────────────────────────────────────── */

export async function listComponentsHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = getUser(req);
    const data = await service.listComponents(req.params.projectId!, user.scope, user.orgId, user.userId);
    sendSuccess(res, data);
  } catch (err) { next(err); }
}

export async function createComponentHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = getUser(req);
    const data = await service.createComponent(
      req.params.projectId!, req.body as CreateComponentInput,
      user.scope, user.orgId, user.userId, getCtx(req)
    );
    sendCreated(res, data);
  } catch (err) { next(err); }
}

export async function updateComponentHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = getUser(req);
    const data = await service.updateComponent(
      req.params.id!, req.body as UpdateComponentInput,
      user.scope, user.orgId, user.userId, getCtx(req)
    );
    sendSuccess(res, data);
  } catch (err) { next(err); }
}

/* ─── Subcomponents ──────────────────────────────────────────────── */

export async function listSubcomponentsHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = getUser(req);
    const data = await service.listSubcomponents(req.params.componentId!, user.scope, user.orgId, user.userId);
    sendSuccess(res, data);
  } catch (err) { next(err); }
}

export async function createSubcomponentHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = getUser(req);
    const data = await service.createSubcomponent(
      req.params.componentId!, req.body as CreateSubcomponentInput,
      user.scope, user.orgId, user.userId, getCtx(req)
    );
    sendCreated(res, data);
  } catch (err) { next(err); }
}

export async function updateSubcomponentHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = getUser(req);
    const data = await service.updateSubcomponent(
      req.params.id!, req.body as UpdateSubcomponentInput,
      user.scope, user.orgId, user.userId, getCtx(req)
    );
    sendSuccess(res, data);
  } catch (err) { next(err); }
}

/* ─── Indicators ─────────────────────────────────────────────────── */

export async function listIndicatorsHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = getUser(req);
    const query = (res.locals.query ?? req.query) as ListIndicatorsQuery;
    const data = await service.listIndicators(query, user.scope, user.orgId, user.userId);
    sendSuccess(res, data);
  } catch (err) { next(err); }
}

export async function getIndicatorHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = getUser(req);
    const data = await service.getIndicator(req.params.id!, user.scope, user.orgId, user.userId);
    sendSuccess(res, data);
  } catch (err) { next(err); }
}

export async function createIndicatorHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = getUser(req);
    const data = await service.createIndicator(
      req.body as CreateIndicatorInput,
      user.scope, user.orgId, user.userId, getCtx(req)
    );
    sendCreated(res, data);
  } catch (err) { next(err); }
}

export async function updateIndicatorHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = getUser(req);
    const data = await service.updateIndicator(
      req.params.id!, req.body as UpdateIndicatorInput,
      user.scope, user.orgId, user.userId, getCtx(req)
    );
    sendSuccess(res, data);
  } catch (err) { next(err); }
}

/* ─── Values ─────────────────────────────────────────────────────── */

export async function listValuesHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = getUser(req);
    const data = await service.listIndicatorValues(req.params.id!, user.scope, user.orgId, user.userId);
    sendSuccess(res, data);
  } catch (err) { next(err); }
}

export async function recordValueHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = getUser(req);
    const data = await service.recordValue(
      req.params.id!, req.body as RecordValueInput,
      user.scope, user.orgId, user.userId, getCtx(req)
    );
    sendCreated(res, data);
  } catch (err) { next(err); }
}

/* ─── Aggregation ────────────────────────────────────────────────── */

export async function aggregateHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = getUser(req);
    const query = (res.locals.query ?? req.query) as AggregateQuery;
    const data = await service.aggregateResults(query, user.scope, user.orgId, user.userId);
    sendSuccess(res, data);
  } catch (err) { next(err); }
}

/* ─── Logframe export ────────────────────────────────────────────── */

export async function logframeHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = getUser(req);
    const buffer = await service.generateLogframeExcel(
      req.params.projectId!, user.scope, user.orgId, user.userId
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="logframe-${req.params.projectId}.xlsx"`
    );
    res.send(buffer);
  } catch (err) { next(err); }
}