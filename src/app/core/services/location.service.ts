import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, shareReplay, throwError } from 'rxjs';
import { Location, LocationSearchParams, NominatimPlace } from '../models/location.models';
import { TtlCache } from '../../shared/utils/ttl-cache';

// Nominatim wird direkt vom Client aufgerufen, nicht über environment.apiUrl
const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
const CACHE_TTL_MS = 10 * 60 * 1000;
const DEFAULT_REVERSE_ZOOM = 12;

@Injectable({
  providedIn: 'root',
})
export class LocationService {
  private readonly http = inject(HttpClient);

  // Cache speichert Observables statt Werte, sodass parallele Requests dedupliziert werden
  private readonly reverseCache = new TtlCache<string, Observable<Location>>(CACHE_TTL_MS);
  private readonly searchCache = new TtlCache<string, Observable<Location[]>>(CACHE_TTL_MS);

  reverseGeocode(
    lat: number,
    lon: number,
    zoom: number = DEFAULT_REVERSE_ZOOM,
  ): Observable<Location> {
    const key = `${lat.toFixed(9)},${lon.toFixed(9)}|${zoom}`;

    const cached = this.reverseCache.get(key);
    if (cached) {
      return cached;
    }

    const params = new HttpParams()
      .set('format', 'json')
      .set('lat', lat.toString())
      .set('lon', lon.toString())
      .set('zoom', zoom.toString());

    const request$ = this.http
      .get<NominatimPlace>(`${NOMINATIM_BASE_URL}/reverse`, { params })
      .pipe(
        map(toLocation),
        catchError((err) => {
          this.reverseCache.delete(key);
          return throwError(() => err);
        }),
        shareReplay({ bufferSize: 1, refCount: false }),
      );

    this.reverseCache.set(key, request$);
    return request$;
  }

  // place name -> lat,lon
  geocode(placeName: string): Observable<Location | undefined> {
    return this.search({ query: placeName, limit: 1 }).pipe(map((results) => results[0]));
  }

  search(searchParams: LocationSearchParams): Observable<Location[]> {
    const key = `${searchParams.query.trim().toLowerCase()}|${searchParams.limit ?? ''}|${searchParams.countryCode ?? ''}`;

    const cached = this.searchCache.get(key);
    if (cached) {
      return cached;
    }

    let params = new HttpParams().set('format', 'json').set('q', searchParams.query);
    if (searchParams.limit) {
      params = params.set('limit', searchParams.limit.toString());
    }
    if (searchParams.countryCode) {
      params = params.set('countrycodes', searchParams.countryCode);
    }

    const request$ = this.http
      .get<NominatimPlace[]>(`${NOMINATIM_BASE_URL}/search`, { params })
      .pipe(
        map((places) =>
          places
            .filter(isSettlement)
            .map(toLocation)
            .filter((location) => matchesQuery(location, searchParams.query)),
        ),
        catchError((err) => {
          this.searchCache.delete(key);
          return throwError(() => err);
        }),
        shareReplay({ bufferSize: 1, refCount: false }),
      );

    this.searchCache.set(key, request$);
    return request$;
  }
}

// Auch wenn wir das Zoom Level festlegen, wollen wir Ergebnisse weiter einschränken
function isSettlement(place: NominatimPlace): boolean {
  return place.class === 'place' || (place.class === 'boundary' && place.type === 'administrative');
}

function toLocation(place: NominatimPlace): Location {
  return {
    lat: parseFloat(place.lat),
    lon: parseFloat(place.lon),
    displayName: place.display_name,
  };
}

// Wir versuchen irelevantere Treffer trotz Nominatim Return rauszufiltern
function matchesQuery(location: Location, query: string): boolean {
  const primaryName = location.displayName.split(',')[0]?.trim().toLowerCase() ?? '';
  return primaryName.includes(query.trim().toLowerCase());
}
