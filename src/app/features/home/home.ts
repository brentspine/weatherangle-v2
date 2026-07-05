import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { BackgroundService } from '../../core/services/background-service';
import { Header } from '../../shared/components/header/header';

@Component({
  selector: 'app-home',
  imports: [Header],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  constructor() {
    inject(BackgroundService).resetToDefault();
  }
}
