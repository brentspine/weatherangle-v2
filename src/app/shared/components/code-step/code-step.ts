import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormError } from '../form-error/form-error';
import { LoadingSpinner } from '../loading-spinner/loading-spinner';

@Component({
  selector: 'app-code-step',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, ReactiveFormsModule, FormError, LoadingSpinner],
  templateUrl: './code-step.html',
  styleUrl: './code-step.scss',
})
export class CodeStep {
  readonly subtitle = input('');
  readonly email = input.required<string>();
  readonly submitLabel = input('Verify');
  readonly loading = input(false);
  readonly errorMessage = input<string | null>(null);

  readonly submitted = output<string>();
  readonly resend = output<void>();
  readonly back = output<void>();

  protected readonly codeControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.pattern(/^\d{6}$/)],
  });

  protected onSubmit(): void {
    if (this.codeControl.invalid) {
      this.codeControl.markAsTouched();
      return;
    }

    this.submitted.emit(this.codeControl.value.trim());
  }
}
