import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { AppError } from '@/lib/errors.js';
import { sendError } from '@/lib/response.js';
import { logger } from '@/config/logger.js';
import { isDev } from '@/config/env.js';

/**
 * Global error handler — the last middleware in the chain.
 * Maps every error to a consistent RFC-7807-style response.
 */
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const correlationId = res.locals.correlationId as string | undefined;

  // Already sent?
  if (res.headersSent) {
    logger.warn({ correlationId }, 'response already sent, cannot handle error');
    return;
  }

  // ── Zod validation (thrown outside validate middleware) ──
  if (err instanceof ZodError) {
    sendError(
      res,
      422,
      'https://api.piims.gov.et/errors/validation-error',
      'Validation Failed',
      'One or more fields are invalid',
      err.issues.map((i) => ({
        field: i.path.join('.') || '(root)',
        code: i.code,
        message: i.message
      }))
    );
    logger.warn({ correlationId, issues: err.issues.length }, 'validation error');
    return;
  }

  // ── Prisma known errors ──
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002': {
        const target = Array.isArray(err.meta?.target) ? err.meta.target : ['field'];
        sendError(
          res,
          409,
          'https://api.piims.gov.et/errors/conflict',
          'Conflict',
          `A record with this ${target.join(', ')} already exists`
        );
        logger.warn({ correlationId, target }, 'unique constraint violation');
        return;
      }
      case 'P2025':
        sendError(
          res,
          404,
          'https://api.piims.gov.et/errors/not-found',
          'Not Found',
          (err.meta?.cause as string) ?? 'Record not found'
        );
        return;
      case 'P2003':
        sendError(
          res,
          422,
          'https://api.piims.gov.et/errors/foreign-key',
          'Invalid Reference',
          'Referenced record does not exist'
        );
        return;
      default:
        logger.error({ correlationId, code: err.code, message: err.message }, 'prisma error');
        sendError(
          res,
          500,
          'https://api.piims.gov.et/errors/internal',
          'Internal Server Error',
          isDev ? err.message : 'An unexpected database error occurred'
        );
        return;
    }
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    logger.error({ correlationId, message: err.message }, 'prisma validation error');
    sendError(
      res,
      422,
      'https://api.piims.gov.et/errors/validation-error',
      'Validation Failed',
      isDev ? err.message : 'Invalid data provided'
    );
    return;
  }

  // ── Application errors ──
  if (err instanceof AppError) {
    const logLevel = err.statusCode >= 500 ? 'error' : 'warn';
    logger[logLevel](
      { correlationId, code: err.code, status: err.statusCode, err: err.message },
      'app error'
    );
    sendError(
      res,
      err.statusCode,
      `https://api.piims.gov.et/errors/${err.code.toLowerCase()}`,
      err.name,
      err.message
    );
    return;
  }

  // ── Unknown errors ──
  const isError = err instanceof Error;
  logger.error(
    {
      correlationId,
      err: isError ? err.message : 'Non-Error thrown',
      stack: isError && isDev ? err.stack : undefined
    },
    'unhandled error'
  );

  sendError(
    res,
    500,
    'https://api.piims.gov.et/errors/internal',
    'Internal Server Error',
    isDev && isError ? err.message : 'An unexpected error occurred'
  );
}