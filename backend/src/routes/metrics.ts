import { Router } from 'express';
import { metrics } from '@/lib/monitoring/metrics.js';

/**
 * Prometheus scrape endpoint. Not authenticated — scrape IPs are allowlisted
 * at the reverse proxy or firewall level in production.
 */
export const metricsRouter: Router = Router();

metricsRouter.get('/metrics', (_req, res) => {
  res.setHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
  res.send(metrics.render());
});