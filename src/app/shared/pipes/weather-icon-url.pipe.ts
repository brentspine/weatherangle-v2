import { Pipe, PipeTransform } from '@angular/core';

// Nur 0-3 haben ein eigenes Nacht-Bild in public/images/wc/
const NIGHT_VARIANT_CODES = new Set([0, 1, 2, 3]);

@Pipe({ name: 'weatherIconUrl' })
export class WeatherIconUrlPipe implements PipeTransform {
  transform(weatherCode: number, isDay = true): string {
    const suffix = !isDay && NIGHT_VARIANT_CODES.has(weatherCode) ? '_night' : '';
    return `/images/wc/weathercode_${weatherCode}${suffix}.png`;
  }
}
