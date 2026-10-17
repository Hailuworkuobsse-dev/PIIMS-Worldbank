import express, { type Express } from 'express';
import { applySecurityMiddleware } from './middleware/security.js';
import { correlationId } from './middleware/correlationId.js';
import { requestLogger } from './middleware/requestLogger.js';
import { globalRateLimiter } from './middleware/rateLimiter.js';
import { notFoundHandler } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiRouter, healthRouter } from './routes/index.js';
import { env } from './config/env.js';

export function buildApp(): Express {
  const app = express();

  // Trust proxy
  if (env.TRUST_PROXY) app.set('trust proxy', 1);

  // ── 1. Security (helmet, CORS, compression) ──
  applySecurityMiddleware(app);

  // ── 2. Correlation ID (before logger so it's available) ──
  app.use(correlationId);

  // ── 3. Structured request logging ──
  app.use(requestLogger);

  // ── 4. Body parsers ──
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // ── 5. Rate limiting (after parsing so we can read body if needed) ──
  app.use(globalRateLimiter);

  // ── 6. Health endpoints (before API prefix, for load balancers) ──
  app.use('/', healthRouter);

  // ── 7. API routes ──
  app.use(env.API_BASE_PATH, apiRouter);

  // ── 8. 404 handler ──
  app.use(notFoundHandler);

  // ── 9. Global error handler (MUST be last) ──
  app.use(errorHandler);

  return app;
}