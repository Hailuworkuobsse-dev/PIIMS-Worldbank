import type { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'node:crypto';

const HEADER = 'x-correlation-id';

/**
 * Attaches a correlation ID to every request. Accepts upstream-provided IDs;
 * generates a UUID if none is supplied.
 */
export function correlationId(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.header(HEADER);
  const id = incoming && incoming.length <= 128 ? incoming : randomUUID();
  req.correlationId = id;
  res.locals.correlationId = id;
  res.setHeader(HEADER, id);
  next();
}