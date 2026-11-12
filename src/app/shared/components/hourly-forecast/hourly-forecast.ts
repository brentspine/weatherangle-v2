import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  QueryList,
  ViewChildren,
  afterNextRender,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { I18nService } from '../../../core/services/i18n.service';
import { HourlyWeather } from '../../../core/models/weather.models';
import { MetricValuePipe } from '../../pipes/metric-value.pipe';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { WeatherIconUrlPipe } from '../../pipes/weather-icon-url.pipe';
import { MetricGrid, MetricItem } from '../metric-grid/metric-grid';

@Component({
  selector: 'app-hourly-forecast',
  imports: [MetricValuePipe, WeatherIconUrlPipe, TranslatePipe, MetricGrid],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './hourly-forecast.html',
  styleUrl: './hourly-forecast.scss',
})
export class HourlyForecast {
  readonly hours = input<HourlyWeather[]>([]);
  readonly currentHourIndex = input(0);

  protected readonly i18n = inject(I18nService);
  protected readonly selectedIndex = signal(0);

  @ViewChildren('hourCard') hourCardRefs!: QueryList<ElementRef<HTMLElement>>;

  constructor() {
    afterNextRender(() => {
      this.scrollToCurrentHour();
    });
  }

  protected readonly detailMetrics = computed<MetricItem[]>(() => {
    const h = this.hours()[this.selectedIndex()];
    if (!h) return [];
    return [
      { icon: 'thermostat', label: this.i18n.translate('hourly.detail.feels_like'), value: h.apparentTemperature, unit: 'celsius' },
      { icon: 'water_drop', label: this.i18n.translate('hourly.detail.humidity'), value: h.relativeHumidity, unit: 'percent' },
      { icon: 'air', label: this.i18n.translate('hourly.detail.wind'), value: h.windSpeed10m, unit: 'kmh' },
      { icon: 'cloud', label: this.i18n.translate('hourly.detail.cloud_cover'), value: h.cloudCover, unit: 'percent' },
    ];
  });

  protected formatHour(time: Date): string {
    const d = new Date(time);
    const h = d.getHours().toString().padStart(2, '0');
    return `${h}:00`;
  }

  protected isCurrentHour(index: number): boolean {
    return index === this.currentHourIndex();
  }

  protected selectHour(index: number): void {
    this.selectedIndex.set(index);
  }

  private scrollToCurrentHour(): void {
    const idx = this.currentHourIndex();
    if (idx <= 0) return;
    const cards = this.hourCardRefs?.toArray();
    if (cards?.[idx]) {
      cards[idx].nativeElement.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
    }
  }
}
