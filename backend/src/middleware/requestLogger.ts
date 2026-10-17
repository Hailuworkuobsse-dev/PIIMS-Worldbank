import pinoHttp from 'pino-http';
import { logger } from '@/config/logger.js';

export const requestLogger = pinoHttp({
  logger,
  genReqId: (req) => (req as { correlationId?: string }).correlationId ?? '',
  customLogLevel: (_req, res, err) => {
    if (err || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  customSuccessMessage: (req, res) =>
    `${req.method} ${req.url} → ${res.statusCode}`,
  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.url,
      userAgent: req.headers['user-agent'],
      remoteAddress: req.remoteAddress
    }),
    res: (res) => ({ statusCode: res.statusCode })
  }
});