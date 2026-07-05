import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Observable, of } from 'rxjs';
import { Location } from '../../core/models/location.models';
import { LocationService } from '../../core/services/location.service';
import { Header } from '../../shared/components/header/header';
import { LoadingSpinner } from '../../shared/components/loading-spinner/loading-spinner';

const COORD_TARGET_PATTERN = /^@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)$/;

@Component({
  selector: 'app-places',
  imports: [Header, LoadingSpinner],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './places.html',
  styleUrl: './places.scss',
})
export class Places {
  private readonly locationService = inject(LocationService);

  readonly target = input.required<string>();
  readonly name = input<string>();

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
    // DisplayName from query param preserves search granularity without router state.
    const queryDisplayName = this.name();
    if (typeof queryDisplayName === 'string' && queryDisplayName.length > 0) {
      return of({ lat, lon, displayName: queryDisplayName });
    }
    return this.locationService.reverseGeocode(lat, lon, 12);
  }
}
