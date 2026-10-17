import type { Request, Response, NextFunction } from 'express';
import { httpMetrics } from '@/lib/monitoring/metrics.js';

export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  res.on('finish', () => {
    const durationMs = Date.now() - start;
    const route = normalizeRoute(req.route?.path ?? req.path);
    const labels = {
      method: req.method,
      route,
      status: String(res.statusCode)
    };
    httpMetrics.requestCount(labels);
    httpMetrics.requestDuration(labels, durationMs);
  });

  next();
}

/**
 * Normalize dynamic route paths — replaces UUIDs with :id to avoid cardinality explosion.
 */
function normalizeRoute(path: string): string {
  return path
    .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:id')
    .replace(/\/PIIMS-\d{4}-\d{4}/g, '/:code')
    .replace(/\/BEN-\d{4}-\d{5}/g, '/:benId')
    .replace(/\/GRV-\d{4}-\d{5}/g, '/:ticket');
}