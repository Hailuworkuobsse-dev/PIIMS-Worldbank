import { pinoHttp } from 'pino-http';
import type { Request, Response } from 'express';

export const requestLogger = pinoHttp({
  genReqId: (req: Request) => (req as { correlationId?: string }).correlationId ?? '',
  customLogLevel: (_req: Request, res: Response, err?: Error) => {
    if (err || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  customSuccessMessage: (req: Request, res: Response) =>
    `${req.method} ${req.url} → ${res.statusCode}`
} as unknown as ReturnType<typeof pinoHttp>);