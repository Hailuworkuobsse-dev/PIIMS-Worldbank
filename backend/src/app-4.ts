import express, { type Express } from 'express';
import { applySecurityMiddleware } from './middleware/security.js';
import { correlationId } from './middleware/correlationId.js';
import { requestLogger } from './middleware/requestLogger.js';
import { metricsMiddleware } from './middleware/metrics.js';
import { globalRateLimiter } from './middleware/rateLimiter.js';
import { notFoundHandler } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiRouter, healthRouter } from './routes/index.js';
import { metricsRouter } from './routes/metrics.js';
import { env } from './config/env.js';

export function buildApp(): Express {
  const app = express();

  // MySQL: BigInt fields (e.g. AuditLog.logId) need string serialization
  app.set('json replacer', (_key: string, value: unknown) =>
    typeof value === 'bigint' ? value.toString() : value
  );

  if (env.TRUST_PROXY) app.set('trust proxy', 1);

  applySecurityMiddleware(app);
  app.use(correlationId);
  app.use(requestLogger);
  app.use(metricsMiddleware);       // ← NEW
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(globalRateLimiter);

  app.use('/', healthRouter);
  app.use('/', metricsRouter);      // ← NEW (mounts /metrics)

  app.use(env.API_BASE_PATH, apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}