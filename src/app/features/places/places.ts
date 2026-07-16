import { Location as BrowserLocation } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Observable, of } from 'rxjs';
import { Location } from '../../core/models/location.models';
import { LocationService } from '../../core/services/location.service';
import { Header } from '../../shared/components/header/header';
import { LoadingSpinner } from '../../shared/components/loading-spinner/loading-spinner';
import { WeatherPage } from '../../shared/components/weather-page/weather-page';

const COORD_TARGET_PATTERN = /^@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)$/;

interface PlacesNavigationState {
  location?: Location;
}

@Component({
  selector: 'app-places',
  imports: [Header, LoadingSpinner, WeatherPage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './places.html',
  styleUrl: './places.scss',
})
export class Places {
  private readonly locationService = inject(LocationService);
  private readonly browserLocation = inject(BrowserLocation);

  readonly target = input.required<string>();

  private readonly locationResource = rxResource({
    params: () => ({ target: this.target() }),
    stream: ({ params }) => this.resolveTarget(params.target),
  });

  protected readonly location = this.locationResource.value;

  private resolveTarget(target: string): Observable<Location | undefined> {
    const coords = COORD_TARGET_PATTERN.exec(target);
    if (!coords) {
      return this.locationService.geocode(decodeURIComponent(target));
    }

    const lat = Number(coords[1]);
    const lon = Number(coords[2]);

    const carried = (this.browserLocation.getState() as PlacesNavigationState | null)?.location;
    if (carried && carried.lat === lat && carried.lon === lon) {
      return of(carried);
    }

    return this.locationService.reverseGeocode(lat, lon, 12);
  }
}
