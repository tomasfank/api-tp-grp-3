import { AppError } from './AppError';

export class AuthorizationError extends AppError {
  constructor(message = 'Permisos insuficientes') {
    super(message, 403);
  }
}
