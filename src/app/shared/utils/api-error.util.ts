import { HttpErrorResponse } from '@angular/common/http';
import { ValidationErrorResponse } from '../../core/models/auth.models';

export function extractApiErrorMessage(
  err: unknown,
  fallback = 'Something went wrong. Please try again.',
): string {
  if (err instanceof HttpErrorResponse) {
    if (typeof err.error === 'string' && err.error.trim()) {
      return err.error;
    }

    const body = err.error as Partial<ValidationErrorResponse> | null;
    if (body?.violations) {
      const messages = Object.values(body.violations);
      if (messages.length > 0) {
        return messages.join(' ');
      }
    }
  }

  return fallback;
}
