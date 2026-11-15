import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-error-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './error-page.html',
  styleUrl: './error-page.scss',
})
export class ErrorPage {
  readonly code = input.required<number>();
  readonly title = input.required<string>();
  readonly message = input<string>();

  protected get imagePath(): string {
    return `/images/httpcode/${this.code()}.avif`;
  }
}
