import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, shareReplay, switchMap, throwError, timer } from 'rxjs';
import { BoundingBox, NearbySettlement, OverpassNode, OverpassResponse } from '../models/overpass.models';
import { TtlCache } from '../../shared/utils/ttl-cache';
import { haversineKm } from '../../shared/utils/geo.util';

// Direkt vom Client aufgerufen, nicht über environment.apiUrl (wie bei Nominatim).
// Gewichtete Spiegel statt fester Reihenfolge, verteilt Last.
// overpass-api.de rate-limited hart, deshalb niedrigstes Gewicht.
const OVERPASS_MIRRORS: readonly { url: string; weight: number }[] = [
  { url: 'https://maps.mail.ru/osm/tools/overpass/api/interpreter', weight: 6 },
  { url: 'https://overpass-api.de/api/interpreter', weight: 1 },
  { url: 'https://overpass.private.coffee/api/interpreter', weight: 0 },
];
const RETRY_DELAY_MS = 2000;
const CACHE_TTL_MS = 5 * 60 * 1000;
const OVERPASS_TIMEOUT_S = 25;
const CANDIDATE_POOL_SIZE = 20;
const CACHE_GRID_DEGREES = 0.1; // ~11 km, kleines Pannen/Zoomen triggert keinen neuen Request

// Ab dieser Diagonale (Welt-/Länderansicht) wird gar nicht erst angefragt, zu großflächig
const MAX_FETCH_DIAGONAL_KM = 3000;

const PLACE_TIERS: readonly { maxDiagonalKm: number; placeTypes: readonly string[] }[] = [
  { maxDiagonalKm: 60, placeTypes: ['city', 'town', 'village'] },
  { maxDiagonalKm: 220, placeTypes: ['city', 'town'] },
  { maxDiagonalKm: MAX_FETCH_DIAGONAL_KM, placeTypes: ['city'] },
];

const PLACE_RANK: Record<string, number> = { city: 3, town: 2, village: 1 };

export function bboxDiagonalKm(bbox: BoundingBox): number {
  const [minLat, maxLat, minLon, maxLon] = bbox;
  return haversineKm(minLat, minLon, maxLat, maxLon);
}

export function placeTypesForBbox(bbox: BoundingBox): readonly string[] {
  const diagonalKm = bboxDiagonalKm(bbox);
  return PLACE_TIERS.find((tier) => diagonalKm <= tier.maxDiagonalKm)?.placeTypes ?? [];
}

// Exportiert für WeatherMap, damit distinctUntilChanged denselben Schlüssel nutzt wie der Cache hier (keine unnötigen Reloads bei Pan innerhalb derselben Zelle)
export function viewportCacheKey(bbox: BoundingBox): string {
  const rounded = bbox.map((v) => Math.round(v / CACHE_GRID_DEGREES) * CACHE_GRID_DEGREES);
  return `${rounded.join(',')}|${placeTypesForBbox(bbox).join(',')}`;
}

// Gewichtete Ziehung ohne Zurücklegen, ergibt gleich die Fallback-Reihenfolge mit
function weightedMirrorOrder(): string[] {
  const pool = OVERPASS_MIRRORS.map((mirror) => ({ ...mirror }));
  const order: string[] = [];

  while (pool.length > 0) {
    const totalWeight = pool.reduce((sum, mirror) => sum + mirror.weight, 0);
    let roll = Math.random() * totalWeight;
    let index = 0;
    while (index < pool.length - 1 && roll > pool[index].weight) {
      roll -= pool[index].weight;
      index++;
    }
    order.push(pool[index].url);
    pool.splice(index, 1);
  }

  return order;
}

@Injectable({ providedIn: 'root' })
export class OverpassService {
  private readonly http = inject(HttpClient);

  // Cache speichert Observables statt Werte, sodass parallele Requests dedupliziert werden
  private readonly cache = new TtlCache<string, Observable<NearbySettlement[]>>(CACHE_TTL_MS);

  // Kandidatenpool nach Bevölkerung/Rang sortiert, bis CANDIDATE_POOL_SIZE. Decluttering macht der Aufrufer, der kennt die Marker-Position.
  // Bewusst kein Parameter dafür, sonst wäre der Cache-Key ortsabhängig.
  nearbySettlements(bbox: BoundingBox): Observable<NearbySettlement[]> {
    const placeTypes = placeTypesForBbox(bbox);
    if (placeTypes.length === 0) {
      return of([]);
    }

    const key = viewportCacheKey(bbox);
    const cached = this.cache.get(key);
    if (cached) {
      return cached;
    }

    const request$ = this.fetchFromMirror(bbox, placeTypes, weightedMirrorOrder(), 0).pipe(
      map((response) => toSettlements(response, CANDIDATE_POOL_SIZE)),
      catchError((err) => {
        this.cache.delete(key);
        return throwError(() => err);
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    this.cache.set(key, request$);
    return request$;
  }

  // Retry nur bei 429 (rate limit) oder 504 (überlastet), alles andere scheitert eh wieder
  private fetchFromMirror(
    bbox: BoundingBox,
    placeTypes: readonly string[],
    mirrorOrder: readonly string[],
    attemptIndex: number,
  ): Observable<OverpassResponse> {
    const body = `data=${encodeURIComponent(buildOverpassQuery(bbox, placeTypes))}`;

    return this.http
      .post<OverpassResponse>(mirrorOrder[attemptIndex], body, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
      .pipe(
        catchError((err) => {
          const isRetryable = err instanceof HttpErrorResponse && (err.status === 429 || err.status === 504);
          const nextAttemptIndex = attemptIndex + 1;
          if (isRetryable && nextAttemptIndex < mirrorOrder.length) {
            return timer(RETRY_DELAY_MS).pipe(
              switchMap(() => this.fetchFromMirror(bbox, placeTypes, mirrorOrder, nextAttemptIndex)),
            );
          }
          return throwError(() => err);
        }),
      );
  }
}

function buildOverpassQuery(bbox: BoundingBox, placeTypes: readonly string[]): string {
  const [minLat, maxLat, minLon, maxLon] = bbox;
  const placeRegex = placeTypes.join('|');
  return (
    `[out:json][timeout:${OVERPASS_TIMEOUT_S}];` +
    `node["place"~"^(${placeRegex})$"](${minLat},${minLon},${maxLat},${maxLon});` +
    `out body;`
  );
}

// Fehlende population zählt als 0 statt die Node auszuschließen, Tiebreak über Place-Rank
function toSettlements(response: OverpassResponse, max: number): NearbySettlement[] {
  return response.elements
    .filter((el): el is OverpassNode & { tags: { name: string } } => !!el.tags?.name)
    .map((el) => ({
      id: el.id,
      lat: el.lat,
      lon: el.lon,
      name: el.tags.name,
      place: el.tags.place ?? 'town',
      population: el.tags.population ? Number(el.tags.population) : undefined,
    }))
    .sort((a, b) => {
      const popDiff = (b.population ?? 0) - (a.population ?? 0);
      return popDiff !== 0 ? popDiff : (PLACE_RANK[b.place] ?? 0) - (PLACE_RANK[a.place] ?? 0);
    })
    .slice(0, max);
}
