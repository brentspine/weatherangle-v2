import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
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

@Component({
  selector: 'app-register',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, AuthLayout, VerificationStepper, FormError, LoadingSpinner],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register {
  private readonly fb = inject(FormBuilder);
  private readonly authApi = inject(AuthApiService);
  private readonly router = inject(Router);

  protected readonly verificationToken = signal<string | null>(null);
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly texts: VerificationStepperTexts = {
    emailSubtitle: 'Enter your email to get started.',
  };

  protected readonly endpoints: VerificationEndpoints = {
    requestCode: (email) => this.authApi.registerRequestEmail(email),
    verifyCode: (email, code) => this.authApi.registerVerifyCode(email, code),
  };

  protected readonly form = this.fb.nonNullable.group({
    username: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  protected onVerified(result: { email: string; token: string }): void {
    this.verificationToken.set(result.token);
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const token = this.verificationToken();
    if (!token) {
      return;
    }

    const { username, password } = this.form.getRawValue();
    this.loading.set(true);
    this.errorMessage.set(null);

    this.authApi.registerAccount({ verificationToken: token, username, password }).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigateByUrl('/login');
      },
      error: (err) => {
        this.loading.set(false);
        const fallback =
          err instanceof HttpErrorResponse && err.status === 409
            ? 'That username is already taken.'
            : 'Could not create your account.';
        this.errorMessage.set(extractApiErrorMessage(err, fallback));
      },
    });
  }
}
