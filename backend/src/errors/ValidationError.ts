import { AppError } from './AppError';

export interface FieldError {
  field: string;
  reason: string;
}

export class ValidationError extends AppError {
  public readonly errors?: FieldError[];

  constructor(message: string, errors?: FieldError[]) {
    super(message, 400);
    this.errors = errors;
  }
}
