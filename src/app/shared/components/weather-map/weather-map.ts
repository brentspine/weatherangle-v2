import {
  ApplicationRef,
  ChangeDetectionStrategy,
  Component,
  ComponentRef,
  DestroyRef,
  ElementRef,
  EnvironmentInjector,
  afterNextRender,
  computed,
  createComponent,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import * as L from 'leaflet';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { BoundingBox, NearbySettlement } from '../../../core/models/overpass.models';
import { OverpassService, bboxDiagonalKm, viewportCacheKey } from '../../../core/services/overpass.service';
import { haversineKm } from '../../utils/geo.util';
import { NearbySettlementMarker } from '../nearby-settlement-marker/nearby-settlement-marker';

// Default Marker-Assets liegen unter public/leaflet/ (siehe angular.json), Leaflet findet sie sonst nicht
L.Icon.Default.imagePath = '';
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  iconUrl: '/leaflet/marker-icon.png',
  shadowUrl: '/leaflet/marker-shadow.png',
});

const NEARBY_FETCH_DEBOUNCE_MS = 700;
const DISPLAY_MAX = 8;
const ACTIVE_MARKER_Z_INDEX_OFFSET = 1000;
// Mindestabstand zwischen Markern, skaliert mit der bbox-Größe
const MIN_SEPARATION_FRACTION = 0.15;
const MIN_SEPARATION_KM_MIN = 3;
const MIN_SEPARATION_KM_MAX = 50;

@Component({
  selector: 'app-weather-map',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './weather-map.html',
  styleUrl: './weather-map.scss',
})
export class WeatherMap {
  readonly lat = input.required<number>();
  readonly lon = input.required<number>();
  readonly zoom = input(11);
  readonly markerLabel = input('');
  // Wenn gesetzt, wird darauf gezoomt statt lat/lon/zoom zu benutzen
  readonly boundingBox = input<[number, number, number, number] | undefined>(undefined);

  readonly nearbySettlementSelected = output<NearbySettlement>();

  private readonly mapContainer = viewChild.required<ElementRef<HTMLElement>>('mapContainer');

  private readonly overpassService = inject(OverpassService);
  private readonly appRef = inject(ApplicationRef);
  private readonly envInjector = inject(EnvironmentInjector);

  // Nominatim lat/lon ist nicht immer die Mitte der boundingBox
  private readonly markerPosition = computed<[number, number]>(() => {
    const boundingBox = this.boundingBox();
    if (boundingBox) {
      const [minLat, maxLat, minLon, maxLon] = boundingBox;
      return [(minLat + maxLat) / 2, (minLon + maxLon) / 2];
    }
    return [this.lat(), this.lon()];
  });

  private readonly viewportChanges = new Subject<BoundingBox>();
  private readonly bboxSignal = signal<BoundingBox | undefined>(undefined);

  private readonly nearbyResource = rxResource({
    params: () => this.bboxSignal(),
    stream: ({ params }) => this.overpassService.nearbySettlements(params),
  });

  // rxResource().value() wird bei Params-Änderung sofort undefined, das würde die Marker
  // kurz verschwinden lassen. Deshalb nur bei 'resolved' übernehmen.
  private readonly resolvedCandidates = signal<NearbySettlement[]>([]);

  // Greedy: behält einen Kandidaten nur, wenn er weit genug von allen bereits behaltenen
  // Punkten entfernt ist (Primary-Marker zählt als erster behaltener Punkt)
  private readonly nearbySettlements = computed<NearbySettlement[]>(() => {
    const candidates = this.resolvedCandidates();
    const bbox = this.bboxSignal();
    if (candidates.length === 0 || !bbox) {
      return [];
    }

    const minSeparationKm = Math.min(
      MIN_SEPARATION_KM_MAX,
      Math.max(MIN_SEPARATION_KM_MIN, bboxDiagonalKm(bbox) * MIN_SEPARATION_FRACTION),
    );

    const [primaryLat, primaryLon] = this.markerPosition();
    const kept: NearbySettlement[] = [];
    const keptPoints: [number, number][] = [[primaryLat, primaryLon]];

    for (const candidate of candidates) {
      if (kept.length >= DISPLAY_MAX) {
        break;
      }
      const tooClose = keptPoints.some(
        ([lat, lon]) => haversineKm(lat, lon, candidate.lat, candidate.lon) < minSeparationKm,
      );
      if (!tooClose) {
        kept.push(candidate);
        keptPoints.push([candidate.lat, candidate.lon]);
      }
    }

    return kept;
  });

  private map: L.Map | undefined;
  private marker: L.Marker | undefined;
  private nearbyLayerGroup: L.LayerGroup | undefined;
  private nearbyMarkers: {
    marker: L.Marker;
    componentRef: ComponentRef<NearbySettlementMarker>;
    settlementId: number;
  }[] = [];
  // Per id statt Marker-Instanz, da Marker bei jedem Refresh neu erzeugt werden
  private lastClickedSettlementId: number | undefined;

  constructor() {
    afterNextRender(() => {
      const map = L.map(this.mapContainer().nativeElement);
      this.applyView(map);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      const marker = L.marker(this.markerPosition()).addTo(map);
      if (this.markerLabel()) {
        marker.bindPopup(this.markerLabel());
      }

      this.map = map;
      this.marker = marker;
      this.nearbyLayerGroup = L.layerGroup().addTo(map);

      // Erster Fetch sofort, ohne auf das Debounce unten zu warten
      this.bboxSignal.set(toBoundingBox(map));
      map.on('moveend', () => this.viewportChanges.next(toBoundingBox(map)));
    });

    this.viewportChanges
      .pipe(
        debounceTime(NEARBY_FETCH_DEBOUNCE_MS),
        distinctUntilChanged((a, b) => viewportCacheKey(a) === viewportCacheKey(b)),
        takeUntilDestroyed(),
      )
      .subscribe((bbox) => this.bboxSignal.set(bbox));

    effect(() => {
      const markerPosition = this.markerPosition();
      const label = this.markerLabel();
      this.zoom();

      if (!this.map || !this.marker) {
        return;
      }

      this.applyView(this.map);
      this.marker.setLatLng(markerPosition);
      if (label) {
        this.marker.bindPopup(label);
      }
    });

    effect(() => {
      if (this.nearbyResource.status() === 'resolved') {
        this.resolvedCandidates.set(this.nearbyResource.value() ?? []);
      }
    });

    // Diff per settlement id statt alle Marker neu zu bauen, sonst würde jeder Marker sein
    // eigenes weather-rxResource neu laden, auch wenn sich an ihm gar nichts geändert hat
    effect(() => {
      const settlements = this.nearbySettlements();
      const layerGroup = this.nearbyLayerGroup;
      if (!layerGroup) {
        return;
      }

      const settlementIds = new Set(settlements.map((s) => s.id));
      const [stale, kept] = partition(this.nearbyMarkers, (entry) => !settlementIds.has(entry.settlementId));
      for (const entry of stale) {
        layerGroup.removeLayer(entry.marker);
        this.appRef.detachView(entry.componentRef.hostView);
        entry.componentRef.destroy();
      }
      this.nearbyMarkers = kept;

      const existingById = new Map(this.nearbyMarkers.map((entry) => [entry.settlementId, entry]));

      for (const settlement of settlements) {
        const existing = existingById.get(settlement.id);
        if (existing) {
          existing.componentRef.setInput('settlement', settlement);
          existing.marker.setLatLng([settlement.lat, settlement.lon]);
          continue;
        }

        const componentRef = createComponent(NearbySettlementMarker, {
          environmentInjector: this.envInjector,
        });
        componentRef.setInput('settlement', settlement);
        this.appRef.attachView(componentRef.hostView);
        componentRef.changeDetectorRef.detectChanges();
        componentRef.instance.detailsRequested.subscribe(() =>
          this.nearbySettlementSelected.emit(settlement),
        );

        const marker = L.marker([settlement.lat, settlement.lon], {
          icon: L.divIcon({
            className: 'nearby-settlement-icon',
            html: componentRef.location.nativeElement,
            iconSize: [0, 0],
            iconAnchor: [0, 0],
          }),
          zIndexOffset: settlement.id === this.lastClickedSettlementId ? ACTIVE_MARKER_Z_INDEX_OFFSET : 0,
        });
        componentRef.instance.activated.subscribe(() => this.activateMarker(settlement.id));
        marker.addTo(layerGroup);
        this.nearbyMarkers.push({ marker, componentRef, settlementId: settlement.id });
      }
    });

    inject(DestroyRef).onDestroy(() => {
      this.map?.remove();
      this.destroyNearbyMarkers();
    });
  }

  private applyView(map: L.Map): void {
    const boundingBox = this.boundingBox();
    if (boundingBox) {
      const [minLat, maxLat, minLon, maxLon] = boundingBox;
      map.fitBounds([
        [minLat, minLon],
        [maxLat, maxLon],
      ]);
    } else {
      map.setView([this.lat(), this.lon()], this.zoom());
    }
  }

  private activateMarker(settlementId: number): void {
    this.lastClickedSettlementId = settlementId;
    for (const { marker, settlementId: id } of this.nearbyMarkers) {
      marker.setZIndexOffset(id === settlementId ? ACTIVE_MARKER_Z_INDEX_OFFSET : 0);
    }
  }

  private destroyNearbyMarkers(): void {
    for (const { componentRef } of this.nearbyMarkers) {
      this.appRef.detachView(componentRef.hostView);
      componentRef.destroy();
    }
    this.nearbyMarkers = [];
  }
}

// Leaflet lässt bounds über -180/180 hinauslaufen, Overpass akzeptiert das nicht
function normalizeLon(lon: number): number {
  return ((((lon + 180) % 360) + 360) % 360) - 180;
}

function toBoundingBox(map: L.Map): BoundingBox {
  const bounds = map.getBounds();
  return [
    bounds.getSouth(),
    bounds.getNorth(),
    normalizeLon(bounds.getWest()),
    normalizeLon(bounds.getEast()),
  ];
}

function partition<T>(items: T[], predicate: (item: T) => boolean): [T[], T[]] {
  const matches: T[] = [];
  const rest: T[] = [];
  for (const item of items) {
    (predicate(item) ? matches : rest).push(item);
  }
  return [matches, rest];
}
