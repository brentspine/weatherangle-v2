import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, shareReplay, tap, throwError } from 'rxjs';
import { Location, LocationSearchParams, NominatimPlace } from '../models/location.models';
import { GeocodePersistentCache } from '../../shared/utils/geocode-persistent-cache';
import { TtlCache } from '../../shared/utils/ttl-cache';

// Nominatim wird direkt vom Client aufgerufen, nicht über environment.apiUrl
const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
const SESSION_CACHE_TTL_MS = 10 * 60 * 1000;
const PERSISTENT_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const DEFAULT_REVERSE_ZOOM = 12;

@Injectable({
  providedIn: 'root',
})
export class LocationService {
  private readonly http = inject(HttpClient);

  // Session cache stores Observables so concurrent requests are deduplicated
  private readonly reverseCache = new TtlCache<string, Observable<Location>>(SESSION_CACHE_TTL_MS);
  private readonly searchCache = new TtlCache<string, Observable<Location[]>>(SESSION_CACHE_TTL_MS);
  // Persistent cache survives page reloads; uses spatial proximity instead of exact key matching
  private readonly persistentCache = new GeocodePersistentCache(PERSISTENT_CACHE_TTL_MS);

  reverseGeocodeFromCache(lat: number, lon: number): Location | null {
    return this.persistentCache.get(lat, lon) ?? null;
  }

  reverseGeocode(
    lat: number,
    lon: number,
    zoom: number = DEFAULT_REVERSE_ZOOM,
  ): Observable<Location> {
    const key = `${lat.toFixed(9)},${lon.toFixed(9)}|${zoom}`;

    const cached = this.reverseCache.get(key);
    if (cached) return cached;

    const persisted = this.persistentCache.get(lat, lon);
    if (persisted) {
      const hit$ = of(persisted).pipe(shareReplay({ bufferSize: 1, refCount: false }));
      this.reverseCache.set(key, hit$);
      return hit$;
    }

    const params = new HttpParams()
      .set('format', 'json')
      .set('lat', lat.toString())
      .set('lon', lon.toString())
      .set('zoom', zoom.toString());

    const request$ = this.http
      .get<NominatimPlace>(`${NOMINATIM_BASE_URL}/reverse`, { params })
      .pipe(
        map((response) => {
          if (response.error) throw new Error('Nominatim could not geocode this location');
          return toLocation(response);
        }),
        tap((location) => this.persistentCache.set(lat, lon, location)),
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

    let params = new HttpParams()
      .set('format', 'json')
      .set('q', searchParams.query)
      // Damit wir auch bei übersetzter display_name (z.B. "Cologne" statt "Köln" bei
      // englischem Accept-Language) noch gegen den lokalen Namen matchen können
      .set('namedetails', '1');
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
            .filter((place) => matchesQuery(place, searchParams.query))
            .map(toLocation),
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
    name: place.name,
    boundingBox: place.boundingbox?.map(Number) as [number, number, number, number] | undefined,
  };
}

// Wir versuchen irrelevantere Treffer trotz Nominatim Return rauszufiltern
function matchesQuery(place: NominatimPlace, query: string): boolean {
  const trimmedQuery = query.trim().toLowerCase();
  const primaryName = place.display_name.split(',')[0]?.trim().toLowerCase() ?? '';
  // display_name wird je nach Accept-Language übersetzt (z.B. "Köln" -> "Cologne"),
  // namedetails.name bleibt der lokale Name, daher zusätzlich dagegen matchen
  const localName = place.namedetails?.['name']?.trim().toLowerCase() ?? '';
  return primaryName.includes(trimmedQuery) || localName.includes(trimmedQuery);
}
