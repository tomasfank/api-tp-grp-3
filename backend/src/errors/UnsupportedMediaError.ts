import { AppError } from './AppError';

export class UnsupportedMediaError extends AppError {
  constructor(message = 'Tipo de contenido no soportado. Se requiere application/json') {
    super(message, 415);
  }
}
