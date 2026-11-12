import { TranslationKey } from '../../core/i18n/translations';
import { Forecast } from '../../core/models/weather.models';
import { Season, TimePeriodOfDay, WeatherDescription } from '../../core/services/background-service';

const CLEAR_CODES = new Set([0, 1]);
const FOGGY_CODES = new Set([45, 48]);
const RAINY_CODES = new Set([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99]);
const SNOWY_CODES = new Set([71, 73, 75, 77, 85, 86]);

// Damit getMonth/getHours usw. die Ortszeit liefern statt der Browser-Zeit
function locationNow(utcOffsetSeconds: number): Date {
  const shifted = new Date(Date.now() + utcOffsetSeconds * 1000);
  return new Date(
    shifted.getUTCFullYear(),
    shifted.getUTCMonth(),
    shifted.getUTCDate(),
    shifted.getUTCHours(),
    shifted.getUTCMinutes(),
    shifted.getUTCSeconds(),
  );
}

function deriveSeason(date: Date): Season {
  const month = date.getMonth();
  if (month === 11 || month <= 1) return Season.winter;
  if (month <= 4) return Season.spring;
  if (month <= 7) return Season.summer;
  return Season.autumn;
}

function deriveTimePeriodOfDay(date: Date, sunrise?: Date, sunset?: Date): TimePeriodOfDay {
  const hour = date.getHours() + date.getMinutes() / 60;

  if (sunrise && sunset) {
    const sunriseHour = sunrise.getHours() + sunrise.getMinutes() / 60;
    const sunsetHour = sunset.getHours() + sunset.getMinutes() / 60;

    if (Math.abs(hour - sunriseHour) <= 0.5) return TimePeriodOfDay.sunrise;
    if (Math.abs(hour - sunsetHour) <= 0.5) return TimePeriodOfDay.sunset;
    if (hour < sunriseHour || hour > sunsetHour) return TimePeriodOfDay.night;
    if (hour < sunriseHour + 4) return TimePeriodOfDay.morning;
    if (hour < sunsetHour - 3) return TimePeriodOfDay.noon;
    return TimePeriodOfDay.evening;
  }

  if (hour < 6 || hour >= 21) return TimePeriodOfDay.night;
  if (hour < 10) return TimePeriodOfDay.morning;
  if (hour < 17) return TimePeriodOfDay.noon;
  return TimePeriodOfDay.evening;
}

const WMO_KEY_MAP: Partial<Record<number, TranslationKey>> = {
  0: 'wmo.0', 1: 'wmo.1', 2: 'wmo.2', 3: 'wmo.3',
  45: 'wmo.45', 48: 'wmo.48',
  51: 'wmo.51', 53: 'wmo.53', 55: 'wmo.55',
  61: 'wmo.61', 63: 'wmo.63', 65: 'wmo.65',
  71: 'wmo.71', 73: 'wmo.73', 75: 'wmo.75', 77: 'wmo.77',
  80: 'wmo.80', 81: 'wmo.81', 82: 'wmo.82',
  85: 'wmo.85', 86: 'wmo.86',
  95: 'wmo.95', 96: 'wmo.96', 99: 'wmo.99',
};

export function wmoCodeToKey(code: number | undefined): TranslationKey {
  if (code === undefined) return 'wmo.unknown';
  return WMO_KEY_MAP[code] ?? 'wmo.unknown';
}

// Für Auto-Hintergrund
export function deriveWeatherDescription(forecast: Forecast): WeatherDescription {
  const weatherCode = forecast.current?.weatherCode ?? forecast.daily?.[0]?.weatherCode;
  const isDay = forecast.current?.isDay;
  const sunrise = forecast.daily?.[0]?.sunrise ? new Date(forecast.daily[0].sunrise) : undefined;
  const sunset = forecast.daily?.[0]?.sunset ? new Date(forecast.daily[0].sunset) : undefined;
  const referenceDate = locationNow(forecast.timezone.utcOffsetSeconds);

  return {
    season: deriveSeason(referenceDate),
    timePeriodOfDay: deriveTimePeriodOfDay(referenceDate, sunrise, sunset),
    isSunny: weatherCode !== undefined && CLEAR_CODES.has(weatherCode) && isDay !== false,
    isRainy: weatherCode !== undefined && RAINY_CODES.has(weatherCode),
    isFoggy: weatherCode !== undefined && FOGGY_CODES.has(weatherCode),
    isSnowy: weatherCode !== undefined && SNOWY_CODES.has(weatherCode),
  };
}
