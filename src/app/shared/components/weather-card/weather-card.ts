import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type WeatherCardVariant = 'outside' | 'colored-header' | 'inside';
export type WeatherCardAccent = 'blue' | 'red' | 'none';

@Component({
  selector: 'app-weather-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './weather-card.html',
  styleUrl: './weather-card.scss',
})
export class WeatherCard {
  readonly variant = input<WeatherCardVariant>('inside');
  readonly title = input('');
  readonly icon = input<string | null>(null);
  readonly accent = input<WeatherCardAccent>('none');
}
