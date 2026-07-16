import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { NearbySettlement } from '../../../core/models/overpass.models';
import { WeatherService } from '../../../core/services/weather.service';
import { MetricValuePipe } from '../../pipes/metric-value.pipe';
import { WeatherIconUrlPipe } from '../../pipes/weather-icon-url.pipe';

@Component({
  selector: 'app-nearby-settlement-marker',
  imports: [MetricValuePipe, WeatherIconUrlPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './nearby-settlement-marker.html',
  styleUrl: './nearby-settlement-marker.scss',
})
export class NearbySettlementMarker {
  readonly settlement = input.required<NearbySettlement>();
  readonly detailsRequested = output<void>();
  // Emitted bei Click auf Marker für z-index (damit es auf jeden Fall über anderen Markern liegt
  readonly activated = output<void>();

  private readonly weatherService = inject(WeatherService);

  protected readonly expanded = signal(false);

  // String statt {lat, lon}-Objekt, sonst dedupelt resource() nicht richtig
  private readonly weatherResource = rxResource({
    params: () => `${this.settlement().lat},${this.settlement().lon}`,
    stream: () => {
      const { lat, lon } = this.settlement();
      return this.weatherService.getWeather(lat, lon, 'preview', 0, 0);
    },
  });

  protected readonly current = computed(() => this.weatherResource.value()?.current);

  protected toggle(): void {
    this.expanded.update((value) => !value);
    this.activated.emit();
  }

  protected onDetailsClick(event: Event): void {
    event.stopPropagation();
    this.detailsRequested.emit();
  }
}
