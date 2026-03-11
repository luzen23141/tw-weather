/**
 * proxy_golang /api/weather/* 回應格式對應的 TypeScript 型別，
 * 以及將後端格式轉換成前端 types.ts 格式的工具函式。
 */

import {
  CurrentWeather,
  DailyForecast,
  HistoricalDayWeather,
  HourlyForecast,
  Location,
  WeatherSource,
} from './types';

// ─── 後端回應型別 ─────────────────────────────────────────────────────────────

export interface ProxyWeatherLocation {
  id?: string;
  name: string;
  lat: number;
  lon: number;
}

export interface ProxyCurrentWeather {
  temperature: number;
  apparentTemperature?: number;
  humidity: number;
  windSpeed: number;
  windDirection?: number;
  pressure?: number;
  visibility?: number;
  uv?: number;
  precipitation?: number;
  weatherCode: number;
  description: string;
  isDay?: boolean;
}

export interface ProxyHourlyWeather {
  time: string; // ISO 8601
  temperature: number;
  apparentTemperature?: number;
  humidity: number;
  windSpeed: number;
  windDirection?: number;
  precipitation?: number;
  precipProb?: number; // %
  weatherCode: number;
  description: string;
}

export interface ProxyDailyWeather {
  date: string; // ISO 8601 (YYYY-MM-DDT...)
  tempMax: number;
  tempMin: number;
  humidity?: number;
  windSpeed?: number;
  precipitation?: number;
  precipProb?: number;
  uv?: number;
  sunrise?: string; // ISO 8601，部分 adapter 不提供
  sunset?: string; // ISO 8601，部分 adapter 不提供
  weatherCode: number;
  description: string;
}

export interface ProxyWeatherResponse {
  provider: string;
  type: 'current' | 'hourly' | 'daily' | 'history';
  location: ProxyWeatherLocation;
  updatedAt: string; // ISO 8601
  current?: ProxyCurrentWeather;
  hourly?: ProxyHourlyWeather[];
  daily?: ProxyDailyWeather[];
}

// ─── 格式轉換 ─────────────────────────────────────────────────────────────────

/**
 * 後端 provider ID → 前端 WeatherSource
 * 後端用 "openmeteo"，前端用 "open-meteo"
 */
export function toWeatherSource(provider: string): WeatherSource {
  if (provider === 'openmeteo') return 'open-meteo';
  return provider as WeatherSource;
}

/** 後端 Location → 前端 Location */
export function toLocation(loc: ProxyWeatherLocation): Location {
  return {
    latitude: loc.lat,
    longitude: loc.lon,
    name: loc.name,
  };
}

/** 後端 CurrentWeather → 前端 CurrentWeather */
export function toCurrentWeather(raw: ProxyCurrentWeather, updatedAt: string): CurrentWeather {
  return {
    timestamp: updatedAt,
    temperature: raw.temperature,
    apparentTemperature: raw.apparentTemperature ?? raw.temperature,
    humidity: raw.humidity,
    description: raw.description,
    weatherCode: raw.weatherCode,
    windSpeed: raw.windSpeed,
    windDirection: raw.windDirection ?? 0,
    precipitation: raw.precipitation ?? 0,
    ...(raw.visibility !== undefined && { visibility: raw.visibility }),
    ...(raw.pressure !== undefined && { pressure: raw.pressure }),
    ...(raw.uv !== undefined && { uvIndex: raw.uv }),
  };
}

/** 後端 HourlyWeather[] → 前端 HourlyForecast[] */
export function toHourlyForecast(items: ProxyHourlyWeather[]): HourlyForecast[] {
  return items.map((h) => ({
    timestamp: h.time,
    temperature: h.temperature,
    apparentTemperature: h.apparentTemperature ?? h.temperature,
    weatherCode: h.weatherCode,
    description: h.description,
    precipitationProbability: h.precipProb ?? 0,
    precipitation: h.precipitation ?? 0,
    humidity: h.humidity,
    windSpeed: h.windSpeed,
    windDirection: h.windDirection ?? 0,
  }));
}

/** 後端 DailyWeather[] → 前端 DailyForecast[] */
export function toDailyForecast(items: ProxyDailyWeather[]): DailyForecast[] {
  return items.map((d) => ({
    // 後端 date 是 ISO 8601（e.g. "2024-01-15T00:00:00Z"），取前 10 碼
    date: d.date.slice(0, 10),
    temperatureMax: d.tempMax,
    temperatureMin: d.tempMin,
    weatherCode: d.weatherCode,
    description: d.description,
    precipitationProbability: d.precipProb ?? 0,
    precipitationSum: d.precipitation ?? 0,
    windSpeedMax: d.windSpeed ?? 0,
    ...(d.sunrise !== undefined && { sunrise: d.sunrise }),
    ...(d.sunset !== undefined && { sunset: d.sunset }),
    ...(d.uv !== undefined && { uvIndexMax: d.uv }),
  }));
}

/** 後端 DailyWeather[] → 前端 HistoricalDayWeather[]（歷史查詢用） */
export function toHistoricalWeather(
  items: ProxyDailyWeather[],
  source: WeatherSource,
): HistoricalDayWeather[] {
  return items.map((d) => ({
    date: d.date.slice(0, 10),
    temperatureMax: d.tempMax,
    temperatureMin: d.tempMin,
    temperatureAvg: (d.tempMax + d.tempMin) / 2,
    weatherCode: d.weatherCode,
    description: d.description,
    precipitationSum: d.precipitation ?? 0,
    windSpeedAvg: d.windSpeed ?? 0,
    humidityAvg: d.humidity ?? 0,
    source,
  }));
}
