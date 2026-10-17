import type { Response } from 'express';

export interface Meta {
  correlationId?: string;
  timestamp: string;
  version: string;
  elapsedMs?: number;
  [k: string]: unknown;
}

export interface SuccessEnvelope<T> {
  data: T;
  meta: Meta;
  pagination?: {
    nextCursor?: string;
    prevCursor?: string;
    limit: number;
    totalCount: number;
    hasMore: boolean;
  };
}

export interface ErrorEnvelope {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  correlationId?: string;
  timestamp: string;
  errors?: Array<{ field: string; code: string; message: string; rejectedValue?: unknown }>;
}

const API_VERSION = '1.0';

function baseMeta(res: Response): Meta {
  return {
    correlationId: res.locals.correlationId as string | undefined,
    timestamp: new Date().toISOString(),
    version: API_VERSION
  };
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode = 200,
  pagination?: SuccessEnvelope<T>['pagination']
): Response {
  const body: SuccessEnvelope<T> = {
    data,
    meta: baseMeta(res),
    ...(pagination ? { pagination } : {})
  };
  return res.status(statusCode).json(body);
}

export function sendCreated<T>(res: Response, data: T): Response {
  return sendSuccess(res, data, 201);
}

export function sendNoContent(res: Response): Response {
  return res.status(204).send();
}

export function sendError(
  res: Response,
  status: number,
  type: string,
  title: string,
  detail?: string,
  errors?: ErrorEnvelope['errors']
): Response {
  const body: ErrorEnvelope = {
    type,
    title,
    status,
    ...(detail ? { detail } : {}),
    instance: res.req.path,
    correlationId: res.locals.correlationId as string | undefined,
    timestamp: new Date().toISOString(),
    ...(errors ? { errors } : {})
  };
  return res.status(status).json(body);
}