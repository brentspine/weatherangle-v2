import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-icon-toggle-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './icon-toggle-button.html',
  styleUrl: './icon-toggle-button.scss',
})
export class IconToggleButton {
  readonly icon = input.required<string>();
  readonly active = input(false);
  readonly ariaLabel = input('');

  readonly toggled = output<boolean>();

  protected onClick(): void {
    this.toggled.emit(!this.active());
  }
}
