import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { toasts, ToastSeverity } from 'brents-toasts';
import { Place } from '../../../core/models/auth.models';
import { Location } from '../../../core/models/location.models';
import { NearbySettlement } from '../../../core/models/overpass.models';
import { AuthService } from '../../../core/services/auth.service';
import { BackgroundService } from '../../../core/services/background-service';
import { I18nService } from '../../../core/services/i18n.service';
import { UserService } from '../../../core/services/user.service';
import { WeatherService } from '../../../core/services/weather.service';
import { deriveWeatherDescription } from '../../utils/weather-description.util';
import { DayMonthPipe } from '../../pipes/day-month.pipe';
import { MetricValuePipe } from '../../pipes/metric-value.pipe';
import { DayNav } from '../day-nav/day-nav';
import { IconToggleButton } from '../icon-toggle-button/icon-toggle-button';
import { MetricGrid, MetricItem } from '../metric-grid/metric-grid';
import { WeatherCard } from '../weather-card/weather-card';
import { WeatherMap } from '../weather-map/weather-map';

@Component({
  selector: 'app-weather-page',
  imports: [DayNav, WeatherCard, MetricGrid, IconToggleButton, WeatherMap, MetricValuePipe, DayMonthPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './weather-page.html',
  styleUrl: './weather-page.scss',
})
export class WeatherPage {
  readonly location = input.required<Location>();

  private readonly weatherService = inject(WeatherService);
  private readonly backgroundService = inject(BackgroundService);
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly i18n = inject(I18nService);

  // Beobachtet lat und lon und lädt bei Änderungen via weatherService automatisch den neuen Forecast
  private readonly forecastResource = rxResource({
    params: () => ({ lat: this.location().lat, lon: this.location().lon }),
    stream: ({ params }) => this.weatherService.getWeather(params.lat, params.lon, 'full', 0, 10),
  });

  protected readonly daily = computed(() => this.forecastResource.value()?.daily ?? []);
  protected readonly current = computed(() => this.forecastResource.value()?.current);

  protected readonly selectedDayIndex = signal(0);
  protected readonly selectedDaily = computed(() => this.daily()[this.selectedDayIndex()]);

  // Für die große Temperaturanzeige rechts
  protected readonly rightTemperature = computed(() => {
    const current = this.current();
    if (current?.temperature !== undefined) {
      return current.temperature;
    }
    const today = this.daily()[0];
    return today?.temperatureMax ?? today?.temperatureMean;
  });

  private readonly place = computed<Place>(() => ({
    lat: this.location().lat,
    lon: this.location().lon,
  }));

  protected readonly isStartPage = computed(() => this.userService.isStartLocation(this.place()));
  protected readonly isFavorite = computed(() => this.userService.isFavourite(this.place()));

  protected readonly placeName = computed(() => this.location().name ?? this.location().displayName);

  protected readonly metricsCardA = computed<MetricItem[]>(() => {
    const day = this.selectedDaily();
    if (!day) {
      return [];
    }
    return [
      { icon: 'wb_twilight', value: day.sunrise, unit: 'time', label: this.i18n.t('metric.sunrise') },
      { icon: 'bedtime', value: day.sunset, unit: 'time', label: this.i18n.t('metric.sunset') },
      {
        icon: 'light_mode',
        value: day.daylightDuration,
        unit: 'durationSeconds',
        label: this.i18n.t('metric.daylight'),
      },
      {
        icon: 'wb_sunny',
        value: day.sunshineDuration,
        unit: 'durationSeconds',
        label: this.i18n.t('metric.sunshine'),
      },
      { icon: 'flare', value: day.uvIndexMax, unit: 'index', label: this.i18n.t('metric.uvIndex') },
    ];
  });

  protected readonly metricsCardB = computed<MetricItem[]>(() => {
    const day = this.selectedDaily();
    if (!day) {
      return [];
    }
    return [
      {
        icon: 'water_drop',
        value: day.precipitationSum,
        unit: 'mm',
        label: this.i18n.t('metric.precipitation'),
      },
      {
        icon: 'rainy',
        value: day.precipitationProbabilityMax,
        unit: 'percent',
        label: this.i18n.t('metric.precipitationProbability'),
      },
      { icon: 'air', value: day.windSpeedMax, unit: 'kmh', label: this.i18n.t('metric.windSpeed') },
      { icon: 'thunderstorm', value: day.windGustsMax, unit: 'kmh', label: this.i18n.t('metric.windGusts') },
      {
        icon: 'thermostat',
        value: day.apparentTemperatureMax,
        unit: 'celsius',
        label: this.i18n.t('metric.feelsLikeMax'),
      },
    ];
  });

  constructor() {
    effect(() => {
      const forecast = this.forecastResource.value();
      if (!forecast) {
        return;
      }
      this.backgroundService.updateBackgroundByWeather(deriveWeatherDescription(forecast));
    });
  }

  protected onStartPageToggled(active: boolean): void {
    if (!this.authService.isAuthenticated()) {
      this.showLoginRequiredToast();
      return;
    }
    const request = active
      ? this.userService.setStartLocation(this.place())
      : this.userService.clearStartLocation();
    request.subscribe({
      error: (err) => console.error('Failed to update start location', err),
    });
  }

  protected onFavoriteToggled(active: boolean): void {
    if (!this.authService.isAuthenticated()) {
      this.showLoginRequiredToast();
      return;
    }
    const request = active
      ? this.userService.addFavourite(this.place())
      : this.userService.removeFavourite(this.place());
    request.subscribe({
      error: (err) => console.error('Failed to update favourite', err),
    });
  }

  private showLoginRequiredToast(): void {
    toasts.showToast(this.i18n.t('weather.loginRequired'), {
      severity: ToastSeverity.WARNING,
    });
  }

  protected onDaySelected(index: number): void {
    this.selectedDayIndex.set(index);
  }

  // Damit der Name nicht neu geladen werden muss, wenn man auf die Karte klickt
  protected onNearbySettlementSelected(settlement: NearbySettlement): void {
    const location: Location = {
      lat: settlement.lat,
      lon: settlement.lon,
      displayName: settlement.name,
      name: settlement.name,
    };
    this.router.navigate(['/places', `@${settlement.lat},${settlement.lon}`], {
      state: { location },
    });
  }
}
