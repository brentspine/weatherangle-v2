import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-form-error',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './form-error.html',
})
export class FormError {
  readonly message = input<string | null>(null);
}
