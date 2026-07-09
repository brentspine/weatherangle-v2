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

    const violationBody = err.error as Partial<ValidationErrorResponse> | null;
    if (violationBody?.violations) {
      const messages = Object.values(violationBody.violations);
      if (messages.length > 0) {
        return messages.join(' ');
      }
    }
    const body = err.error;
    if (body) {
      if(typeof body.message === 'string') {
        return body.message;
      }
    }
  }

  return fallback;
}
