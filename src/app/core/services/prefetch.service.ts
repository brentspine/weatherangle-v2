import { Injectable, inject } from '@angular/core';
import { EMPTY, Observable, catchError, concatMap, from, switchMap, timer } from 'rxjs';
import { LocationService } from './location.service';
import { SurpriseLocationService } from './surprise-location.service';

@Injectable({ providedIn: 'root' })
export class PrefetchService {
  private readonly tasks: Array<() => Observable<unknown>>;

  constructor() {
    const locationService = inject(LocationService);
    const surpriseService = inject(SurpriseLocationService);

    this.tasks = [
      () => {
        const toFetch = surpriseService.getSuggestions().filter(
          (p) => !locationService.reverseGeocodeFromCache(p.lat, p.lon),
        );
        if (!toFetch.length) return EMPTY;
        return from(toFetch).pipe(
          concatMap((place, index) =>
            timer(index === 0 ? 0 : 1200).pipe(
              switchMap(() => locationService.reverseGeocode(place.lat, place.lon)),
              catchError(() => EMPTY),
            ),
          ),
        );
      },
    ];
  }

  runWhenIdle(): void {
    const execute = () => {
      for (const task of this.tasks) {
        task().pipe(catchError(() => EMPTY)).subscribe();
      }
    };

    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(execute);
    } else {
      setTimeout(execute, 0);
    }
  }
}
