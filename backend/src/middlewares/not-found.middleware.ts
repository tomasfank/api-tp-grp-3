import { Request, Response, NextFunction } from 'express';
import { NotFoundError } from '../errors';

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(new NotFoundError(`La ruta '${req.originalUrl}' no fue encontrada`));
}
