import rateLimit from 'express-rate-limit';
import { env } from '@/config/env.js';
import { sendError } from '@/lib/response.js';

/**
 * Stricter rate limiter specifically for login and MFA endpoints.
 * Successful requests are NOT counted (skipSuccessfulRequests).
 */
export const loginRateLimiter = rateLimit({
  windowMs: 60_000,
  max: env.RATE_LIMIT_LOGIN_MAX,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => {
    const body = req.body as { username?: string } | undefined;
    return `${req.ip ?? 'unknown'}:${body?.username ?? ''}`;
  },
  handler: (req, res) => {
    sendError(
      res,
      429,
      'https://api.piims.gov.et/errors/rate-limit',
      'Too Many Login Attempts',
      'Please wait a minute before trying again'
    );
  }
});