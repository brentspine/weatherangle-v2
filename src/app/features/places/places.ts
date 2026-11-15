import { Location as BrowserLocation } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Observable, map, of, throwError } from 'rxjs';
import { Location } from '../../core/models/location.models';
import { LocationService } from '../../core/services/location.service';
import { ErrorPage } from '../../shared/components/error-page/error-page';
import { Header } from '../../shared/components/header/header';
import { LoadingSpinner } from '../../shared/components/loading-spinner/loading-spinner';
import { WeatherPage } from '../../shared/components/weather-page/weather-page';

const COORD_TARGET_PATTERN = /^@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)$/;

interface PlacesNavigationState {
  location?: Location;
}

export class InvalidCoordinatesError extends Error {
  constructor() {
    super('Coordinates are outside valid bounds');
  }
}

@Component({
  selector: 'app-places',
  imports: [Header, LoadingSpinner, WeatherPage, ErrorPage],
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
  protected readonly locationError = this.locationResource.error;

  protected readonly isInvalidCoords = computed(() => {
    const err = this.locationError();
    return err instanceof InvalidCoordinatesError;
  });

  private resolveTarget(target: string): Observable<Location | undefined> {
    const coords = COORD_TARGET_PATTERN.exec(target);
    if (!coords) {
      return this.locationService.geocode(decodeURIComponent(target));
    }

    const lat = Number(coords[1]);
    const lon = Number(coords[2]);

    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return throwError(() => new InvalidCoordinatesError());
    }

    const carried = (this.browserLocation.getState() as PlacesNavigationState | null)?.location;
    if (carried && carried.lat === lat && carried.lon === lon) {
      return of(carried);
    }

    return this.locationService.reverseGeocode(lat, lon, 12).pipe(
      map((location) => ({ ...location, lat, lon })),
    );
  }
}
