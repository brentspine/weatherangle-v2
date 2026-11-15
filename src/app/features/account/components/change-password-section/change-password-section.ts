import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  signal,
} from '@angular/core';
import { toasts, ToastSeverity } from 'brents-toasts';
import { AuthApiService } from '../../../../core/services/auth-api.service';
import { I18nService } from '../../../../core/services/i18n.service';
import { FormError } from '../../../../shared/components/form-error/form-error';
import { LoadingSpinner } from '../../../../shared/components/loading-spinner/loading-spinner';
import { extractApiErrorMessage } from '../../../../shared/utils/api-error.util';

function passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
  const a = control.get('newPassword')?.value;
  const b = control.get('confirmPassword')?.value;
  return a === b ? null : { passwordsMismatch: true };
}

@Component({
  selector: 'app-change-password-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, FormError, LoadingSpinner],
  templateUrl: './change-password-section.html',
  styleUrl: './change-password-section.scss',
})
export class ChangePasswordSection {
  readonly securityToken = input.required<string>();

  private readonly authApi = inject(AuthApiService);
  private readonly fb = inject(FormBuilder);
  protected readonly i18n = inject(I18nService);

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group(
    {
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordsMatchValidator },
  );

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const { newPassword } = this.form.getRawValue();

    this.authApi.securityChangePassword(this.securityToken(), newPassword).subscribe({
      next: () => {
        this.loading.set(false);
        this.form.reset();
        toasts.showToast(this.i18n.t('account.passwordChanged'), {
          severity: ToastSeverity.SUCCESS,
        });
      },
      error: (err) => {
        this.loading.set(false);
        const isAuthError = err?.status === 403;
        this.error.set(
          isAuthError
            ? this.i18n.t('error.securitySessionExpired')
            : extractApiErrorMessage(err, this.i18n.t('error.changePasswordExpired')),
        );
      },
    });
  }
}
