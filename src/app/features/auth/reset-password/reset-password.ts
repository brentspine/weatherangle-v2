import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { catchError, map, of, throwError } from 'rxjs';
import { AuthApiService } from '../../../core/services/auth-api.service';
import { AuthLayout } from '../../../shared/components/auth-layout/auth-layout';
import { FormError } from '../../../shared/components/form-error/form-error';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import {
  VerificationEndpoints,
  VerificationStepper,
  VerificationStepperTexts,
} from '../../../shared/components/verification-stepper/verification-stepper';
import { extractApiErrorMessage } from '../../../shared/utils/api-error.util';

function passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
  const newPassword = control.get('newPassword')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;
  return newPassword === confirmPassword ? null : { passwordsMismatch: true };
}

@Component({
  selector: 'app-reset-password',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, AuthLayout, VerificationStepper, FormError, LoadingSpinner],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.scss',
})
export class ResetPassword {
  private readonly fb = inject(FormBuilder);
  private readonly authApi = inject(AuthApiService);
  private readonly router = inject(Router);

  protected readonly resetToken = signal<string | null>(null);
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly texts: VerificationStepperTexts = {
    emailSubtitle: "Enter your account's email and we'll send you a code.",
  };

  protected readonly endpoints: VerificationEndpoints = {
    // 404 wird als Erfolg behandelt, um E-Mail-Enumeration zu verhindern
    requestCode: (email) =>
      this.authApi.passwordResetRequest(email).pipe(
        map(() => undefined),
        catchError((err) => {
          if (err instanceof HttpErrorResponse && err.status === 404) {
            return of(undefined);
          }
          return throwError(() => err);
        }),
      ),
    verifyCode: (email, code) => this.authApi.passwordResetVerifyCode(email, code),
  };

  protected readonly form = this.fb.nonNullable.group(
    {
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordsMatchValidator },
  );

  protected onVerified(result: { email: string; token: string }): void {
    this.resetToken.set(result.token);
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const token = this.resetToken();
    if (!token) {
      return;
    }

    const { newPassword } = this.form.getRawValue();
    this.loading.set(true);
    this.errorMessage.set(null);

    this.authApi.passwordReset({ resetToken: token, newPassword }).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigateByUrl('/login');
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(
          extractApiErrorMessage(err, 'Your reset code expired. Please start over.'),
        );
        // Startet EmailStep neu
        this.resetToken.set(null);
        this.form.reset();
      },
    });
  }
}
