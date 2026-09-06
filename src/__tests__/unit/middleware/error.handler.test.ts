import { Request, Response, NextFunction } from 'express';
import * as fc from 'fast-check';
import { errorHandler } from '../../../middlewares/error.middleware';
import { AppError } from '../../../errors/AppError';
import { ValidationError } from '../../../errors/ValidationError';
import { AuthenticationError } from '../../../errors/AuthenticationError';
import { AuthorizationError } from '../../../errors/AuthorizationError';
import { NotFoundError } from '../../../errors/NotFoundError';
import { ConflictError } from '../../../errors/ConflictError';
import { UnsupportedMediaError } from '../../../errors/UnsupportedMediaError';

// ─── helpers ──────────────────────────────────────────────────────────────────

function buildMocks() {
  const json = jest.fn().mockReturnThis();
  const status = jest.fn().mockReturnValue({ json });
  const mockReq = {} as Request;
  const mockRes = { status, json } as unknown as Response;
  const mockNext = jest.fn() as unknown as NextFunction;
  return { mockReq, mockRes, mockNext, status, json };
}

/** Returns true when the value looks like a file-system path */
function containsPath(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  return /\/Users\/|\/home\/|src\/|\.ts\b|\.js\b/.test(value);
}

/** Recursively scans any JSON-serialisable value for stack-like strings */
function hasStackTrace(body: unknown): boolean {
  if (body === null || body === undefined) return false;
  if (typeof body === 'string') {
    return body.includes('at ') || containsPath(body);
  }
  if (Array.isArray(body)) return body.some(hasStackTrace);
  if (typeof body === 'object') {
    return Object.values(body as Record<string, unknown>).some(hasStackTrace);
  }
  return false;
}

// ─── AppError subclasses ──────────────────────────────────────────────────────

describe('errorHandler — AppError subclasses', () => {
  it('handles AuthenticationError (401)', () => {
    const { mockReq, mockRes, mockNext, status, json } = buildMocks();
    const err = new AuthenticationError('Token inválido');

    errorHandler(err, mockReq, mockRes, mockNext);

    expect(status).toHaveBeenCalledWith(401);
    const body = json.mock.calls[0][0];
    expect(body.status).toBe(401);
    expect(typeof body.message).toBe('string');
    expect(body).not.toHaveProperty('stack');
    expect(hasStackTrace(body)).toBe(false);
  });

  it('handles AuthorizationError (403)', () => {
    const { mockReq, mockRes, mockNext, status, json } = buildMocks();
    const err = new AuthorizationError('Sin permisos');

    errorHandler(err, mockReq, mockRes, mockNext);

    expect(status).toHaveBeenCalledWith(403);
    const body = json.mock.calls[0][0];
    expect(body.status).toBe(403);
    expect(typeof body.message).toBe('string');
    expect(hasStackTrace(body)).toBe(false);
  });

  it('handles NotFoundError (404)', () => {
    const { mockReq, mockRes, mockNext, status, json } = buildMocks();
    const err = new NotFoundError('Recurso no encontrado');

    errorHandler(err, mockReq, mockRes, mockNext);

    expect(status).toHaveBeenCalledWith(404);
    const body = json.mock.calls[0][0];
    expect(body.status).toBe(404);
    expect(typeof body.message).toBe('string');
    expect(hasStackTrace(body)).toBe(false);
  });

  it('handles ConflictError (409)', () => {
    const { mockReq, mockRes, mockNext, status, json } = buildMocks();
    const err = new ConflictError('Conflicto de datos');

    errorHandler(err, mockReq, mockRes, mockNext);

    expect(status).toHaveBeenCalledWith(409);
    const body = json.mock.calls[0][0];
    expect(body.status).toBe(409);
    expect(typeof body.message).toBe('string');
    expect(hasStackTrace(body)).toBe(false);
  });

  it('handles UnsupportedMediaError (415)', () => {
    const { mockReq, mockRes, mockNext, status, json } = buildMocks();
    const err = new UnsupportedMediaError();

    errorHandler(err, mockReq, mockRes, mockNext);

    expect(status).toHaveBeenCalledWith(415);
    const body = json.mock.calls[0][0];
    expect(body.status).toBe(415);
    expect(typeof body.message).toBe('string');
    expect(hasStackTrace(body)).toBe(false);
  });

  it('response body contains only status and message (no extra fields)', () => {
    const { mockReq, mockRes, mockNext, json } = buildMocks();
    const err = new NotFoundError();

    errorHandler(err, mockReq, mockRes, mockNext);

    const body = json.mock.calls[0][0];
    expect(Object.keys(body)).toEqual(expect.arrayContaining(['status', 'message']));
    expect(body).not.toHaveProperty('stack');
    expect(body).not.toHaveProperty('stackTrace');
  });
});

// ─── ValidationError ──────────────────────────────────────────────────────────

describe('errorHandler — ValidationError', () => {
  it('returns 400 with errors array when field errors are provided', () => {
    const { mockReq, mockRes, mockNext, status, json } = buildMocks();
    const fieldErrors = [
      { field: 'email', reason: 'Formato inválido' },
      { field: 'password', reason: 'Mínimo 8 caracteres' },
    ];
    const err = new ValidationError('Datos de entrada inválidos', fieldErrors);

    errorHandler(err, mockReq, mockRes, mockNext);

    expect(status).toHaveBeenCalledWith(400);
    const body = json.mock.calls[0][0];
    expect(body.status).toBe(400);
    expect(typeof body.message).toBe('string');
    expect(Array.isArray(body.errors)).toBe(true);
    expect(body.errors).toHaveLength(2);
    expect(body.errors[0]).toMatchObject({ field: 'email', reason: expect.any(String) });
    expect(hasStackTrace(body)).toBe(false);
  });

  it('returns 400 with undefined errors when no field errors provided', () => {
    const { mockReq, mockRes, mockNext, status, json } = buildMocks();
    const err = new ValidationError('Error genérico de validación');

    errorHandler(err, mockReq, mockRes, mockNext);

    expect(status).toHaveBeenCalledWith(400);
    const body = json.mock.calls[0][0];
    expect(body.status).toBe(400);
    expect(typeof body.message).toBe('string');
    // errors key is present but undefined (as set by the handler)
    expect(body).not.toHaveProperty('stack');
    expect(hasStackTrace(body)).toBe(false);
  });

  it('errors array items contain field and reason strings', () => {
    const { mockReq, mockRes, mockNext, json } = buildMocks();
    const err = new ValidationError('Inválido', [{ field: 'name', reason: 'Requerido' }]);

    errorHandler(err, mockReq, mockRes, mockNext);

    const body = json.mock.calls[0][0];
    expect(body.errors[0].field).toBe('name');
    expect(body.errors[0].reason).toBe('Requerido');
  });
});

// ─── Unexpected errors ────────────────────────────────────────────────────────

describe('errorHandler — unexpected (non-AppError) errors', () => {
  beforeEach(() => jest.spyOn(console, 'error').mockImplementation(() => {}));
  afterEach(() => jest.restoreAllMocks());

  it('returns 500 with generic Spanish message', () => {
    const { mockReq, mockRes, mockNext, status, json } = buildMocks();
    const err = new Error('Something totally unexpected');

    errorHandler(err, mockReq, mockRes, mockNext);

    expect(status).toHaveBeenCalledWith(500);
    const body = json.mock.calls[0][0];
    expect(body.status).toBe(500);
    expect(body.message).toBe('Ha ocurrido un error interno en el servidor');
  });

  it('does not expose stack trace in 500 response', () => {
    const { mockReq, mockRes, mockNext, json } = buildMocks();
    const err = new Error('Crash!');

    errorHandler(err, mockReq, mockRes, mockNext);

    const body = json.mock.calls[0][0];
    expect(body).not.toHaveProperty('stack');
    expect(body).not.toHaveProperty('stackTrace');
    expect(hasStackTrace(body)).toBe(false);
  });

  it('does not expose file paths or implementation details in 500 response', () => {
    const { mockReq, mockRes, mockNext, json } = buildMocks();
    const err = new Error('DB connection failed at /Users/tomasfank/src/db.ts:42');

    errorHandler(err, mockReq, mockRes, mockNext);

    const body = json.mock.calls[0][0];
    // The error message from the original error must NOT appear in the response
    expect(JSON.stringify(body)).not.toContain('/Users');
    expect(JSON.stringify(body)).not.toContain('src/db.ts');
  });

  it('handles non-Error throwables (plain objects)', () => {
    const { mockReq, mockRes, mockNext, status } = buildMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    errorHandler({ message: 'plain' } as any, mockReq, mockRes, mockNext);
    expect(status).toHaveBeenCalledWith(500);
  });
});

// ─── Property 25 — standardised JSON error format ─────────────────────────────

describe('Property 25 — standardised JSON error format', () => {
  // Feature: vaultra-consulting-backend, Property 25: Las respuestas de error tienen formato JSON estandarizado

  beforeEach(() => jest.spyOn(console, 'error').mockImplementation(() => {}));
  afterEach(() => jest.restoreAllMocks());

  it(
    // Feature: vaultra-consulting-backend, Property 25: Las respuestas de error tienen formato JSON estandarizado
    'AppError with any 4xx/5xx code always produces {status (number), message (string)} without stack traces',
    () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 400, max: 599 }),
          fc.string({ minLength: 1, maxLength: 200 }),
          (statusCode, message) => {
            const { mockReq, mockRes, mockNext, status, json } = buildMocks();
            const err = new AppError(message, statusCode);

            errorHandler(err, mockReq, mockRes, mockNext);

            expect(status).toHaveBeenCalledWith(statusCode);
            const body = json.mock.calls[0][0];
            expect(typeof body.status).toBe('number');
            expect(body.status).toBe(statusCode);
            expect(typeof body.message).toBe('string');
            expect(body).not.toHaveProperty('stack');
            expect(body).not.toHaveProperty('stackTrace');
            expect(hasStackTrace(body)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    }
  );

  it(
    // Feature: vaultra-consulting-backend, Property 25: Las respuestas de error tienen formato JSON estandarizado
    'ValidationError always produces {status: 400, message (string), errors (array)} without stack traces',
    () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 200 }),
          fc.array(
            fc.record({
              field: fc.string({ minLength: 1, maxLength: 50 }),
              reason: fc.string({ minLength: 1, maxLength: 200 }),
            }),
            { minLength: 0, maxLength: 10 }
          ),
          (message, fieldErrors) => {
            const { mockReq, mockRes, mockNext, status, json } = buildMocks();
            const err = new ValidationError(message, fieldErrors.length > 0 ? fieldErrors : undefined);

            errorHandler(err, mockReq, mockRes, mockNext);

            expect(status).toHaveBeenCalledWith(400);
            const body = json.mock.calls[0][0];
            expect(typeof body.status).toBe('number');
            expect(body.status).toBe(400);
            expect(typeof body.message).toBe('string');
            expect(body).not.toHaveProperty('stack');
            expect(hasStackTrace(body)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    }
  );

  it(
    // Feature: vaultra-consulting-backend, Property 25: Las respuestas de error tienen formato JSON estandarizado
    'Unexpected (non-AppError) errors always produce {status: 500, message (string)} without stack traces',
    () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 200 }),
          (message) => {
            const { mockReq, mockRes, mockNext, status, json } = buildMocks();
            const err = new Error(message);

            errorHandler(err, mockReq, mockRes, mockNext);

            expect(status).toHaveBeenCalledWith(500);
            const body = json.mock.calls[0][0];
            expect(typeof body.status).toBe('number');
            expect(body.status).toBe(500);
            expect(typeof body.message).toBe('string');
            expect(body).not.toHaveProperty('stack');
            expect(body).not.toHaveProperty('stackTrace');
            expect(hasStackTrace(body)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    }
  );
});
