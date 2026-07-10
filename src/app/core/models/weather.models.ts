export type TimezoneName =
  | 'GMT'
  | 'America/Anchorage'
  | 'America/Los_Angeles'
  | 'America/Denver'
  | 'America/Chicago'
  | 'America/New_York'
  | 'America/Sao_Paulo'
  | 'Europe/London'
  | 'Europe/Berlin'
  | 'Europe/Moscow'
  | 'Africa/Cairo'
  | 'Asia/Bangkok'
  | 'Asia/Singapore'
  | 'Asia/Tokyo'
  | 'Australia/Sydney'
  | 'Pacific/Auckland';

export interface Timezone {
  timezone: TimezoneName;
  utcOffsetSeconds: number;
  timezoneAbbreviation: string;
}

export interface Forecast {
  lat: number;
  lon: number;
  elevation: number;
  generationTimeMs: number;
  timezone: Timezone;
  current?: CurrentWeather;
  hourly?: HourlyWeather[];
  daily?: DailyWeather[];
}

export interface CurrentWeather {
  time: Date;
  weatherCode: number;
  isDay?: boolean;
  temperature?: number;
  relativeHumidity?: number;
  apparentTemperature?: number;
  precipitation?: number;
  rain?: number;
  showers?: number;
  snowfall?: number;
  cloudCover?: number;
  pressureMsl?: number;
  surfacePressure?: number;
  windSpeed?: number;
  windDirection?: number;
  windGusts?: number;
}

export interface HourlyWeather {
  time: Date;
  weatherCode: number;
  temperature?: number;
  relativeHumidity?: number;
  dewPoint?: number;
  apparentTemperature?: number;
  precipitationProbability?: number;
  precipitation?: number;
  rain?: number;
  showers?: number;
  snowfall?: number;
  snowDepth?: number;
  pressureMsl?: number;
  surfacePressure?: number;
  cloudCover?: number;
  cloudCoverLow?: number;
  cloudCoverMid?: number;
  cloudCoverHigh?: number;
  visibility?: number;
  evapotranspiration?: number;
  et0FaoEvapotranspiration?: number;
  vapourPressureDeficit?: number;
  windSpeed10m?: number;
  windSpeed80m?: number;
  windSpeed120m?: number;
  windSpeed180m?: number;
  windDirection10m?: number;
  windDirection80m?: number;
  windDirection120m?: number;
  windDirection180m?: number;
  windGusts10m?: number;
  temperature80m?: number;
  temperature120m?: number;
  temperature180m?: number;
  soilTemperature0cm?: number;
  soilTemperature6cm?: number;
  soilTemperature18cm?: number;
  soilTemperature54cm?: number;
  soilMoisture0To1cm?: number;
  soilMoisture1To3cm?: number;
  soilMoisture3To9cm?: number;
  soilMoisture9To27cm?: number;
  soilMoisture27To81cm?: number;
}

export interface DailyWeather {
  time: Date;
  weatherCode: number;
  temperatureMax?: number;
  temperatureMin?: number;
  temperatureMean?: number;
  apparentTemperatureMax?: number;
  apparentTemperatureMin?: number;
  apparentTemperatureMean?: number;
  sunrise?: Date;
  sunset?: Date;
  daylightDuration?: number;
  sunshineDuration?: number;
  uvIndexMax?: number;
  uvIndexClearSkyMax?: number;
  rainSum?: number;
  showersSum?: number;
  snowfallSum?: number;
  precipitationSum?: number;
  precipitationHours?: number;
  precipitationProbabilityMax?: number;
  windSpeedMax?: number;
  windGustsMax?: number;
  windDirectionDominant?: number;
  shortwaveRadiationSum?: number;
  et0FaoEvapotranspiration?: number;
}
