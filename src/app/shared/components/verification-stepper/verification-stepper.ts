import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { extractApiErrorMessage } from '../../utils/api-error.util';
import { CodeStep } from '../code-step/code-step';
import { EmailStep } from '../email-step/email-step';

export interface VerificationEndpoints {
  requestCode(email: string): Observable<void>;
  verifyCode(email: string, code: string): Observable<{ token: string }>;
}

export interface VerificationStepperTexts {
  // wird im Email-Schritt unter dem Titel angezeigt
  emailSubtitle?: string;
  // Beschriftung des Buttons im Email-Schritt
  emailSubmitLabel?: string;
  // wird im Code-Schritt unter dem Titel angezeigt
  codeSubtitle?: string;
  // Beschriftung des Buttons im Code-Schritt
  codeSubmitLabel?: string;
}

@Component({
  selector: 'app-verification-stepper',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EmailStep, CodeStep],
  templateUrl: './verification-stepper.html',
  styleUrl: './verification-stepper.scss',
})
export class VerificationStepper {
  readonly texts = input.required<VerificationStepperTexts>();
  readonly endpoints = input.required<VerificationEndpoints>();

  readonly verified = output<{ email: string; token: string }>();

  protected readonly step = signal<'email' | 'code'>('email');
  protected readonly email = signal('');
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected onEmailSubmit(email: string): void {
    this.email.set(email);
    this.requestCode(email);
  }

  protected onCodeSubmit(code: string): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.endpoints()
      .verifyCode(this.email(), code)
      .subscribe({
        next: ({ token }) => {
          this.loading.set(false);
          this.verified.emit({ email: this.email(), token });
        },
        error: (err) => {
          this.loading.set(false);
          this.errorMessage.set(extractApiErrorMessage(err, 'Invalid or expired code.'));
        },
      });
  }

  protected onResend(): void {
    this.requestCode(this.email());
  }

  protected onChangeEmail(): void {
    this.step.set('email');
    this.errorMessage.set(null);
  }

  private requestCode(email: string): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.endpoints()
      .requestCode(email)
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.step.set('code');
        },
        error: (err) => {
          this.loading.set(false);
          this.errorMessage.set(extractApiErrorMessage(err));
        },
      });
  }
}
