import pino from 'pino';
import { env } from './env.js';

const transport = env.LOG_PRETTY
  ? pino.transport({
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:yyyy-mm-dd HH:MM:ss.l',
        ignore: 'pid,hostname',
        singleLine: false
      }
    })
  : undefined;

export const logger = pino(
  {
    level: env.LOG_LEVEL,
    base: { service: 'piims-backend', env: env.NODE_ENV },
    timestamp: pino.stdTimeFunctions.isoTime,
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'req.body.password',
        'req.body.refresh_token',
        'req.body.mfa_code',
        'res.headers["set-cookie"]',
        '*.password',
        '*.passwordHash',
        '*.mfaSecret',
        '*.token'
      ],
      censor: '[REDACTED]'
    }
  },
  transport
);

export type Logger = typeof logger;