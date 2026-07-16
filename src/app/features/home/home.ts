import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Location } from '../../core/models/location.models';
import { BackgroundService } from '../../core/services/background-service';
import { Header } from '../../shared/components/header/header';
import { WeatherPage } from '../../shared/components/weather-page/weather-page';

@Component({
  selector: 'app-home',
  imports: [Header, WeatherPage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  // TODO: aus /auth/me oder IP-Ortung holen statt fest zu verdrahten
  protected readonly defaultLocation: Location = { lat: 52.52, lon: 13.41, displayName: 'Berlin, Germany' };

  constructor() {
    inject(BackgroundService).resetToDefault();
  }
}
