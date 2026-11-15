import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { AuthApiService } from '../../../../core/services/auth-api.service';
import { AuthService } from '../../../../core/services/auth.service';
import { I18nService } from '../../../../core/services/i18n.service';
import { CodeStep } from '../../../../shared/components/code-step/code-step';
import { FormError } from '../../../../shared/components/form-error/form-error';
import { LoadingSpinner } from '../../../../shared/components/loading-spinner/loading-spinner';
import { extractApiErrorMessage } from '../../../../shared/utils/api-error.util';
import { ChangePasswordSection } from '../change-password-section/change-password-section';

const TOKEN_TTL_MS = 10 * 60 * 1000;

type UnlockStep = 'idle' | 'pending-code';

@Component({
  selector: 'app-security-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CodeStep, FormError, LoadingSpinner, ChangePasswordSection],
  templateUrl: './security-panel.html',
  styleUrl: './security-panel.scss',
})
export class SecurityPanel {
  private readonly authApi = inject(AuthApiService);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly i18n = inject(I18nService);

  protected readonly currentUser = this.authService.currentUser;

  protected readonly securityToken = signal<string | null>(null);
  protected readonly isLocked = computed(() => this.securityToken() === null);
  protected readonly unlockStep = signal<UnlockStep>('idle');
  protected readonly unlockLoading = signal(false);
  protected readonly unlockError = signal<string | null>(null);

  private expiryTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => this.clearTimer());
  }

  protected onRequestUnlock(): void {
    this.unlockLoading.set(true);
    this.unlockError.set(null);

    this.authApi.securityRequestCode().subscribe({
      next: () => {
        this.unlockLoading.set(false);
        this.unlockStep.set('pending-code');
      },
      error: (err) => {
        this.unlockLoading.set(false);
        this.unlockError.set(extractApiErrorMessage(err));
      },
    });
  }

  protected onCodeSubmit(code: string): void {
    this.unlockLoading.set(true);
    this.unlockError.set(null);

    this.authApi.securityVerifyCode(code).subscribe({
      next: ({ token }) => {
        this.unlockLoading.set(false);
        this.unlockStep.set('idle');
        this.securityToken.set(token);
        this.startExpiryTimer();
      },
      error: (err) => {
        this.unlockLoading.set(false);
        this.unlockError.set(
          extractApiErrorMessage(err, this.i18n.t('error.invalidOrExpiredCode')),
        );
      },
    });
  }

  protected lock(): void {
    this.securityToken.set(null);
    this.unlockStep.set('idle');
    this.unlockError.set(null);
    this.clearTimer();
  }

  private startExpiryTimer(): void {
    this.clearTimer();
    this.expiryTimer = setTimeout(() => this.lock(), TOKEN_TTL_MS);
  }

  private clearTimer(): void {
    if (this.expiryTimer !== null) {
      clearTimeout(this.expiryTimer);
      this.expiryTimer = null;
    }
  }
}
