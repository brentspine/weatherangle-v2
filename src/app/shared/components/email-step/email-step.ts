import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormError } from '../form-error/form-error';
import { LoadingSpinner } from '../loading-spinner/loading-spinner';

@Component({
  selector: 'app-email-step',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, ReactiveFormsModule, FormError, LoadingSpinner],
  templateUrl: './email-step.html',
  styleUrl: './email-step.scss',
})
export class EmailStep {
  readonly subtitle = input('');
  readonly submitLabel = input('Continue');
  readonly loading = input(false);
  readonly errorMessage = input<string | null>(null);

  readonly submitted = output<string>();

  protected readonly emailControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.email],
  });

  protected onSubmit(): void {
    if (this.emailControl.invalid) {
      this.emailControl.markAsTouched();
      return;
    }

    this.submitted.emit(this.emailControl.value.trim());
  }
}
