/**
 * Typed error hierarchy — every route handler throws AppError subclasses;
 * the global errorHandler middleware maps them to HTTP responses.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;
  public readonly isOperational: boolean;

  constructor(
    statusCode: number,
    code: string,
    message: string,
    details?: unknown,
    isOperational = true
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad request', details?: unknown) {
    super(400, 'PIIMS-4000', message, details);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details?: unknown) {
    super(422, 'PIIMS-4220', message, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(401, 'PIIMS-4010', message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access denied', details?: unknown) {
    super(403, 'PIIMS-4030', message, details);
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource', id?: string) {
    super(404, 'PIIMS-4040', `${resource}${id ? ` '${id}'` : ''} not found`);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict', details?: unknown) {
    super(409, 'PIIMS-4090', message, details);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message = 'Too many requests') {
    super(429, 'PIIMS-4290', message);
  }
}

export class InternalError extends AppError {
  constructor(message = 'Internal server error', details?: unknown) {
    super(500, 'PIIMS-5000', message, details, false);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message = 'Service unavailable', details?: unknown) {
    super(503, 'PIIMS-5030', message, details);
  }
}

/* ─── Domain-specific errors (used in Steps 4–9) ─── */
export class DuplicateProjectCodeError extends ConflictError {
  constructor(code: string) {
    super(`Project code '${code}' already exists`, { code: 'PIIMS-1001' });
  }
}

export class StageGateNotSatisfiedError extends ValidationError {
  constructor(missing: string[]) {
    super('Stage gate requirements not satisfied', { missing, code: 'PIIMS-1002' });
  }
}

export class ConsentRequiredError extends ValidationError {
  constructor() {
    super('Beneficiary consent is required', { code: 'PIIMS-5002' });
  }
}

export class DuplicateSubmissionError extends ConflictError {
  constructor() {
    super('This submission has already been recorded', { code: 'PIIMS-6002' });
  }
}

export class DuaRequiredError extends ForbiddenError {
  constructor() {
    super('A signed Data Use Agreement is required before download', {
      code: 'PIIMS-9001'
    } as unknown as string);
  }
}