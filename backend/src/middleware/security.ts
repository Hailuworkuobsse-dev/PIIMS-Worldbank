import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import type { Express } from 'express';
import { corsOrigins, env } from '@/config/env.js';

export function applySecurityMiddleware(app: Express): void {
  // Helmet — sets security headers (CSP, HSTS, X-Frame-Options, etc.)
  app.use(
    helmet({
      contentSecurityPolicy: env.NODE_ENV === 'production' ? {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'blob:'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'", 'data:'],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"]
        }
      } : false,
      crossOriginResourcePolicy: { policy: 'same-site' },
      crossOriginEmbedderPolicy: false,
      hsts: env.NODE_ENV === 'production'
        ? { maxAge: 63_072_000, includeSubDomains: true, preload: true }
        : false
    })
  );

  // CORS
  app.use(
    cors({
      origin: corsOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Correlation-ID',
        'X-Idempotency-Key',
        'X-API-Key',
        'Accept-Language'
      ],
      exposedHeaders: ['X-Correlation-ID', 'X-RateLimit-Limit', 'X-RateLimit-Remaining']
    })
  );

  // Compression
  app.use(compression());

  // Trust proxy (if behind reverse proxy)
  if (env.TRUST_PROXY) app.set('trust proxy', 1);
}