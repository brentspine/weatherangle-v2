import { ChangeDetectionStrategy, Component, inject, untracked } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { Location } from '../../core/models/location.models';
import { AuthService } from '../../core/services/auth.service';
import { BackgroundService } from '../../core/services/background-service';
import { LocationService } from '../../core/services/location.service';
import { Header } from '../../shared/components/header/header';
import { LoadingSpinner } from '../../shared/components/loading-spinner/loading-spinner';
import { WeatherPage } from '../../shared/components/weather-page/weather-page';

// TODO: bei fehlender startLocation per IP-Ortung ermitteln statt fest zu verdrahten
const DEFAULT_LOCATION: Location = { lat: 52.52, lon: 13.41, displayName: 'Berlin, Germany' };

@Component({
  selector: 'app-home',
  imports: [Header, WeatherPage, LoadingSpinner],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  private readonly authService = inject(AuthService);
  private readonly locationService = inject(LocationService);

  // Nur einmal beim Betreten der Seite auflösen, nicht bei jeder Änderung von currentUser
  // (sonst würde z.B. ein Favorit-Toggle die Seite neu laden und den Stern wieder deaktivieren)
  private readonly startLocationResource = rxResource({
    params: () => ({}),
    stream: () => {
      const startLocation = untracked(() => this.authService.currentUser()?.startLocation ?? null);
      return startLocation
        ? this.locationService.reverseGeocode(startLocation.lat, startLocation.lon)
        : of(DEFAULT_LOCATION);
    },
  });

  protected readonly location = this.startLocationResource.value;

  constructor() {
    inject(BackgroundService).resetToDefault();
  }
}
