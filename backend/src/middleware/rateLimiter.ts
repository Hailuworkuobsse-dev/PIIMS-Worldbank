import rateLimit from 'express-rate-limit';
import { env } from '@/config/env.js';
import { sendError } from '@/lib/response.js';

/** Global rate limit — applied in app.ts */
export const globalRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (req, res) => {
    sendError(res, 429, 'https://api.piims.gov.et/errors/rate-limit', 'Too Many Requests',
      `Exceeded ${env.RATE_LIMIT_MAX} requests per ${env.RATE_LIMIT_WINDOW_MS / 1000}s window`);
  }
});

/** Login-specific limiter — stricter, applied to /auth/login only */
export const loginRateLimiter = rateLimit({
  windowMs: 60_000,
  max: env.RATE_LIMIT_LOGIN_MAX,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: (req, res) => {
    sendError(res, 429, 'https://api.piims.gov.et/errors/rate-limit', 'Too Many Login Attempts',
      'Please wait before trying again');
  }
});