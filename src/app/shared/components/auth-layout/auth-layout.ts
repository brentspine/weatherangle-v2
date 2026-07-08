import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BackgroundService } from '../../../core/services/background-service';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-auth-layout',
  imports: [RouterLink, NgOptimizedImage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './auth-layout.html',
  styleUrl: './auth-layout.scss',
})
export class AuthLayout {
  readonly title = input.required<string>();
  readonly subtitle = input('');

  constructor() {
    inject(BackgroundService).setAuthBackground();
  }
}
