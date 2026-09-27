import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';
import { ValidationError } from '../errors/ValidationError';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ValidationError) {
    res.status(err.statusCode).json({
      status: err.statusCode,
      message: err.message,
      errors: err.errors,
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      status: err.statusCode,
      message: err.message,
    });
    return;
  }

  // Unexpected / unhandled error — no stack traces exposed
  console.error('Unhandled error:', err);
  res.status(500).json({
    status: 500,
    message: 'Ha ocurrido un error interno en el servidor',
  });
}
