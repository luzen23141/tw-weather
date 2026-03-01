import type { CurrentWeather, DailyForecast, HourlyForecast } from '../../src/api/types';

export const createMockCurrentWeather = (overrides?: Partial<CurrentWeather>): CurrentWeather => ({
  timestamp: '2024-02-27T10:00:00Z',
  temperature: 25.5,
  apparentTemperature: 24.0,
  humidity: 65,
  description: '晴天',
  weatherCode: 0,
  windSpeed: 10,
  windDirection: 180,
  precipitation: 0,
  pressure: 1013.25,
  visibility: 10000,
  ...overrides,
});

export const createMockHourlyForecast = (overrides?: Partial<HourlyForecast>): HourlyForecast => ({
  timestamp: '2024-02-27T11:00:00Z',
  temperature: 26.0,
  apparentTemperature: 24.5,
  humidity: 60,
  description: '晴天',
  weatherCode: 0,
  windSpeed: 12,
  windDirection: 180,
  precipitation: 0,
  precipitationProbability: 0,
  ...overrides,
});

export const createMockDailyForecast = (overrides?: Partial<DailyForecast>): DailyForecast => ({
  date: '2024-02-28',
  temperatureMax: 28.0,
  temperatureMin: 20.0,
  weatherCode: 1,
  description: '多雲',
  precipitationProbability: 20,
  precipitationSum: 0,
  sunrise: '06:30:00',
  sunset: '18:30:00',
  windSpeedMax: 15,
  uvIndexMax: 6,
  ...overrides,
});

export const createMockWeatherData = (overrides?: {
  current?: Partial<CurrentWeather>;
  [key: string]: unknown;
}) => ({
  current: createMockCurrentWeather(overrides?.current),
  hourly: [
    createMockHourlyForecast({ timestamp: '2024-02-27T11:00:00Z' }),
    createMockHourlyForecast({ timestamp: '2024-02-27T12:00:00Z' }),
  ],
  daily: [
    createMockDailyForecast({ date: '2024-02-28' }),
    createMockDailyForecast({ date: '2024-02-29' }),
    createMockDailyForecast({ date: '2024-03-01' }),
  ],
  ...overrides,
});
