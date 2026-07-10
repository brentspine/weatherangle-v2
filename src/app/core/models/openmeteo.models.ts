export interface OpenMeteoForecastResponse {
  latitude: number;
  longitude: number;
  generationtime_ms: number;
  utc_offset_seconds: number;
  timezone: string;
  timezone_abbreviation: string;
  elevation: number;
  current_units?: Record<string, string>;
  current?: OpenMeteoCurrent;
  hourly_units?: Record<string, string>;
  hourly?: OpenMeteoHourly;
  daily_units?: Record<string, string>;
  daily?: OpenMeteoDaily;
}

export interface OpenMeteoCurrent {
  time: string;
  weather_code: number;
  interval?: number;
  temperature_2m?: number;
  relative_humidity_2m?: number;
  apparent_temperature?: number;
  is_day?: number;
  precipitation?: number;
  rain?: number;
  showers?: number;
  snowfall?: number;
  cloud_cover?: number;
  pressure_msl?: number;
  surface_pressure?: number;
  wind_speed_10m?: number;
  wind_direction_10m?: number;
  wind_gusts_10m?: number;
}

export interface OpenMeteoHourly {
  time: string[];
  weather_code: number[];
  temperature_2m?: number[];
  relative_humidity_2m?: number[];
  dew_point_2m?: number[];
  apparent_temperature?: number[];
  precipitation_probability?: number[];
  precipitation?: number[];
  rain?: number[];
  showers?: number[];
  snowfall?: number[];
  pressure_msl?: number[];
  surface_pressure?: number[];
  cloud_cover?: number[];
  cloud_cover_low?: number[];
  cloud_cover_mid?: number[];
  cloud_cover_high?: number[];
  visibility?: number[];
  wind_speed_10m?: number[];
  wind_direction_10m?: number[];
  wind_gusts_10m?: number[];
  [key: string]: string[] | number[] | undefined;
}

export interface OpenMeteoDaily {
  time: string[];
  weather_code: number[];
  temperature_2m_max?: number[];
  temperature_2m_min?: number[];
  apparent_temperature_max?: number[];
  apparent_temperature_min?: number[];
  sunrise?: string[];
  sunset?: string[];
  daylight_duration?: number[];
  sunshine_duration?: number[];
  uv_index_max?: number[];
  uv_index_clear_sky_max?: number[];
  rain_sum?: number[];
  snowfall_sum?: number[];
  showers_sum?: number[];
  precipitation_sum?: number[];
  precipitation_hours?: number[];
  precipitation_probability_max?: number[];
  wind_speed_10m_max?: number[];
  wind_gusts_10m_max?: number[];
  wind_direction_10m_dominant?: number[];
  shortwave_radiation_sum?: number[];
  et0_fao_evapotranspiration?: number[];
  temperature_2m_mean?: number[];
  apparent_temperature_mean?: number[];
}
