import { Request, Response, NextFunction } from 'express';
import { ZodType } from 'zod';
import { ValidationError, FieldError } from '../errors';

export function validateBody(schema: ZodType) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors: FieldError[] = result.error.issues.map((e) => ({
        field: e.path.join('.'),
        reason: e.message,
      }));
      next(new ValidationError('Datos de entrada inválidos', errors));
      return;
    }
    req.body = result.data;
    next();
  };
}

export function validateQuery(schema: ZodType) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const errors: FieldError[] = result.error.issues.map((e) => ({
        field: e.path.join('.'),
        reason: e.message,
      }));
      next(new ValidationError('Parámetros de consulta inválidos', errors));
      return;
    }
    // `req.query` is a getter-only property in Express 5, so it cannot be
    // reassigned directly. Redefine the property to expose the parsed/coerced
    // values (e.g. numeric pagination params instead of raw strings).
    Object.defineProperty(req, 'query', {
      value: result.data,
      writable: true,
      configurable: true,
      enumerable: true,
    });
    next();
  };
}
