import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';
import { ZodError } from 'zod';
import { sendError } from '@/lib/response.js';

export interface ValidationSchemas {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

/**
 * Zod validation middleware. Parses `body`, `query`, `params` and replaces
 * them with parsed (typed) values. Reports structured field errors on failure.
 */
export function validate(schemas: ValidationSchemas) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (schemas.params) {
        req.params = schemas.params.parse(req.params) as typeof req.params;
      }
      if (schemas.query) {
        // Store parsed query in res.locals so handlers can use typed values
        res.locals.query = schemas.query.parse(req.query);
      }
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const errors = err.issues.map((i) => ({
          field: i.path.join('.') || '(root)',
          code: i.code,
          message: i.message,
          rejectedValue: 'received' in i ? i.received : undefined
        }));
        sendError(
          res,
          422,
          'https://api.piims.gov.et/errors/validation-error',
          'Validation Failed',
          'One or more fields are invalid',
          errors
        );
        return;
      }
      next(err);
    }
  };
}