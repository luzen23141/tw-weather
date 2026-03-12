/**
 * 資料源資料契約測試
 *
 * 驗證各 adapter 回傳的格式符合前端頁面所需的欄位契約。
 * 所有 adapter 現在透過 proxy_golang /api/weather/* 取得資料。
 */

import type {
  CurrentWeather,
  DailyForecast,
  HistoricalDayWeather,
  HourlyForecast,
  Location,
} from '@/api/types';

// Mock proxyFetch（所有 adapter 統一使用 proxyFetch + buildWeatherUrl）
jest.mock('@/api/proxy-fetch', () => ({
  buildWeatherUrl: jest.fn(
    (endpoint: string, params: Record<string, string>) =>
      `https://proxy.test/api/weather/${endpoint}?${new URLSearchParams(params).toString()}`,
  ),
  proxyFetch: jest.fn(),
}));

import { proxyFetch } from '@/api/proxy-fetch';
import cwaAdapter from '@/api/adapters/cwa.adapter';
import openMeteoAdapter from '@/api/adapters/open-meteo.adapter';
import weatherApiAdapter from '@/api/adapters/weatherapi.adapter';
import { weatherService } from '@/api/weather.service';

const mockProxyFetch = proxyFetch as jest.MockedFunction<typeof proxyFetch>;

const TEST_LOCATION: Location = {
  name: '台北市信義區',
  city: '台北市',
  district: '信義區',
  latitude: 25.033,
  longitude: 121.5654,
};

// ─── 共用 mock 資料 ────────────────────────────────────────────────────────────

const MOCK_CURRENT_RESPONSE = {
  provider: 'cwa',
  type: 'current',
  location: { name: '台北', lat: 25.037, lon: 121.563 },
  updatedAt: '2026-03-07T10:00:00+08:00',
  current: {
    temperature: 20.1,
    apparentTemperature: 19.5,
    humidity: 82,
    windSpeed: 1.2,
    windDirection: 200,
    pressure: 1012.5,
    visibility: 10.0,
    weatherCode: 3,
    description: '陰',
    precipitation: 0,
  },
};

const MOCK_HOURLY_RESPONSE = {
  provider: 'cwa',
  type: 'hourly',
  location: { name: '信義區', lat: 25.033, lon: 121.565 },
  updatedAt: '2026-03-07T10:00:00+08:00',
  hourly: [
    {
      time: '2026-03-07T12:00:00+08:00',
      temperature: 21.0,
      apparentTemperature: 22.0,
      humidity: 80,
      windSpeed: 3.0,
      windDirection: 150,
      precipitation: 0,
      precipProb: 40,
      weatherCode: 3,
      description: '陰',
    },
  ],
};

const MOCK_DAILY_RESPONSE = {
  provider: 'cwa',
  type: 'daily',
  location: { name: '信義區', lat: 25.033, lon: 121.565 },
  updatedAt: '2026-03-07T10:00:00+08:00',
  daily: [
    {
      date: '2026-03-07T00:00:00Z',
      tempMax: 24.0,
      tempMin: 18.0,
      humidity: 75,
      windSpeed: 5.0,
      precipitation: 0,
      precipProb: 30,
      weatherCode: 3,
      description: '陰',
    },
  ],
};

const MOCK_HISTORY_RESPONSE = {
  provider: 'openmeteo',
  type: 'history',
  location: { name: '', lat: 25.033, lon: 121.565 },
  updatedAt: '2026-03-07T00:00:00Z',
  daily: [
    {
      date: '2026-03-06T00:00:00Z',
      tempMax: 28.0,
      tempMin: 21.0,
      humidity: 75,
      windSpeed: 14.0,
      precipitation: 2.2,
      precipProb: 40,
      weatherCode: 2,
      description: '多雲',
    },
  ],
};

// ─── 資料契約驗證輔助函式 ────────────────────────────────────────────────────

function expectCurrentContract(current: CurrentWeather) {
  expect(Number.isFinite(current.temperature)).toBe(true);
  expect(Number.isFinite(current.apparentTemperature)).toBe(true);
  expect(Number.isFinite(current.humidity)).toBe(true);
  expect(Number.isFinite(current.weatherCode)).toBe(true);
  expect(Number.isFinite(current.windSpeed)).toBe(true);
  expect(Number.isFinite(current.windDirection)).toBe(true);
  expect(Number.isFinite(current.precipitation)).toBe(true);
  expect(typeof current.description).toBe('string');
  expect(current.description.length).toBeGreaterThan(0);
  expect(typeof current.timestamp).toBe('string');
}

function expectHourlyContract(hourly: HourlyForecast[]) {
  expect(hourly.length).toBeGreaterThan(0);
  const first = hourly[0];
  expect(first).toBeDefined();
  if (!first) return;

  expect(typeof first.timestamp).toBe('string');
  expect(Number.isFinite(first.temperature)).toBe(true);
  expect(Number.isFinite(first.apparentTemperature)).toBe(true);
  expect(Number.isFinite(first.weatherCode)).toBe(true);
  expect(Number.isFinite(first.precipitationProbability)).toBe(true);
  expect(Number.isFinite(first.precipitation)).toBe(true);
  expect(Number.isFinite(first.humidity)).toBe(true);
  expect(Number.isFinite(first.windSpeed)).toBe(true);
  expect(Number.isFinite(first.windDirection)).toBe(true);
}

function expectDailyContract(daily: DailyForecast[]) {
  expect(daily.length).toBeGreaterThan(0);
  const first = daily[0];
  expect(first).toBeDefined();
  if (!first) return;

  expect(typeof first.date).toBe('string');
  expect(Number.isFinite(first.temperatureMax)).toBe(true);
  expect(Number.isFinite(first.temperatureMin)).toBe(true);
  expect(Number.isFinite(first.weatherCode)).toBe(true);
  expect(Number.isFinite(first.precipitationProbability)).toBe(true);
  expect(Number.isFinite(first.precipitationSum)).toBe(true);
}

function expectHistoryContract(history: HistoricalDayWeather[]) {
  expect(history.length).toBeGreaterThan(0);
  const first = history[0];
  expect(first).toBeDefined();
  if (!first) return;

  expect(typeof first.date).toBe('string');
  expect(Number.isFinite(first.temperatureMax)).toBe(true);
  expect(Number.isFinite(first.temperatureMin)).toBe(true);
  expect(Number.isFinite(first.temperatureAvg)).toBe(true);
  expect(Number.isFinite(first.weatherCode)).toBe(true);
  expect(Number.isFinite(first.precipitationSum)).toBe(true);
  expect(Number.isFinite(first.windSpeedAvg)).toBe(true);
  expect(Number.isFinite(first.humidityAvg)).toBe(true);
}

function makeOkResponse(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    json: () => Promise.resolve(body),
  } as unknown as Response;
}

function makeErrorResponse(status = 500): Response {
  return {
    ok: false,
    status,
    statusText: 'ERROR',
    json: () => Promise.resolve({ error: 'failed' }),
  } as unknown as Response;
}

// ─── 測試 ─────────────────────────────────────────────────────────────────────

describe('資料源資料契約（頁面使用欄位）', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.EXPO_PUBLIC_PROXY_URL = 'https://proxy.test';
  });

  it('CWA adapter 應回傳首頁與預報頁需要的欄位', async () => {
    mockProxyFetch
      .mockResolvedValueOnce(makeOkResponse(MOCK_CURRENT_RESPONSE))
      .mockResolvedValueOnce(makeOkResponse(MOCK_HOURLY_RESPONSE))
      .mockResolvedValueOnce(makeOkResponse(MOCK_DAILY_RESPONSE));

    const result = await cwaAdapter.fetchWeather(TEST_LOCATION);
    expectCurrentContract(result.current);
    expectHourlyContract(result.hourlyForecast);
    expectDailyContract(result.dailyForecast);
  });

  it('CWA township-only location 在資料契約下仍成立', async () => {
    const townshipOnlyLocation: Location = {
      name: '新北市板橋區',
      city: '新北市',
      township: '板橋區',
      latitude: 25.0142,
      longitude: 121.4592,
    };

    mockProxyFetch
      .mockResolvedValueOnce(makeOkResponse({ ...MOCK_CURRENT_RESPONSE, provider: 'cwa' }))
      .mockResolvedValueOnce(makeOkResponse(MOCK_HOURLY_RESPONSE))
      .mockResolvedValueOnce(makeOkResponse(MOCK_DAILY_RESPONSE));

    const result = await cwaAdapter.fetchWeather(townshipOnlyLocation);
    expectCurrentContract(result.current);
    expectHourlyContract(result.hourlyForecast);
    expectDailyContract(result.dailyForecast);
  });

  it('CWA fallback 路徑下 hourly/daily 資料契約仍成立', async () => {
    const fallbackLocation: Location = {
      name: '新北市板橋區',
      city: '新北市',
      township: '板橋區',
      latitude: 25.0142,
      longitude: 121.4592,
    };

    mockProxyFetch
      .mockResolvedValueOnce(makeOkResponse(MOCK_CURRENT_RESPONSE))
      .mockResolvedValueOnce(makeOkResponse(MOCK_HOURLY_RESPONSE))
      .mockResolvedValueOnce(makeOkResponse(MOCK_DAILY_RESPONSE));

    const result = await cwaAdapter.fetchWeather(fallbackLocation);
    expectHourlyContract(result.hourlyForecast);
    expectDailyContract(result.dailyForecast);
  });

  it('Open-Meteo adapter 應回傳首頁與預報頁需要的欄位', async () => {
    const openMeteoCurrentResp = { ...MOCK_CURRENT_RESPONSE, provider: 'openmeteo' };
    const openMeteoHourlyResp = { ...MOCK_HOURLY_RESPONSE, provider: 'openmeteo' };
    const openMeteoDailyResp = { ...MOCK_DAILY_RESPONSE, provider: 'openmeteo' };

    mockProxyFetch
      .mockResolvedValueOnce(makeOkResponse(openMeteoCurrentResp))
      .mockResolvedValueOnce(makeOkResponse(openMeteoHourlyResp))
      .mockResolvedValueOnce(makeOkResponse(openMeteoDailyResp));

    const result = await openMeteoAdapter.fetchWeather(TEST_LOCATION);
    expectCurrentContract(result.current);
    expectHourlyContract(result.hourlyForecast);
    expectDailyContract(result.dailyForecast);
  });

  it('WeatherAPI adapter 應回傳首頁與預報頁需要的欄位', async () => {
    const weatherApiCurrentResp = { ...MOCK_CURRENT_RESPONSE, provider: 'weatherapi' };
    const weatherApiHourlyResp = { ...MOCK_HOURLY_RESPONSE, provider: 'weatherapi' };
    const weatherApiDailyResp = { ...MOCK_DAILY_RESPONSE, provider: 'weatherapi' };

    mockProxyFetch
      .mockResolvedValueOnce(makeOkResponse(weatherApiCurrentResp))
      .mockResolvedValueOnce(makeOkResponse(weatherApiHourlyResp))
      .mockResolvedValueOnce(makeOkResponse(weatherApiDailyResp));

    const result = await weatherApiAdapter.fetchWeather(TEST_LOCATION);
    expectCurrentContract(result.current);
    expectHourlyContract(result.hourlyForecast);
    expectDailyContract(result.dailyForecast);
  });

  it('OpenWeatherMap adapter 應回傳首頁與預報頁需要的欄位', async () => {
    const { default: openWeatherMapAdapter } =
      await import('@/api/adapters/openweathermap.adapter');

    const owmCurrentResp = { ...MOCK_CURRENT_RESPONSE, provider: 'openweathermap' };
    const owmHourlyResp = { ...MOCK_HOURLY_RESPONSE, provider: 'openweathermap' };
    const owmDailyResp = { ...MOCK_DAILY_RESPONSE, provider: 'openweathermap' };

    // OpenWeatherMap 現在與其他 adapter 一樣使用 /api/weather/* 端點
    mockProxyFetch.mockImplementation((url: string) => {
      if (url.includes('/current')) return Promise.resolve(makeOkResponse(owmCurrentResp));
      if (url.includes('/hourly')) return Promise.resolve(makeOkResponse(owmHourlyResp));
      if (url.includes('/daily')) return Promise.resolve(makeOkResponse(owmDailyResp));
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    const result = await openWeatherMapAdapter.fetchWeather(TEST_LOCATION);
    expectCurrentContract(result.current);
    expectHourlyContract(result.hourlyForecast);
    expectDailyContract(result.dailyForecast);
  });

  it('單一來源 weatherService 在 WeatherAPI 歷史失敗時仍可回傳首頁與預報資料', async () => {
    const weatherApiCurrentResp = { ...MOCK_CURRENT_RESPONSE, provider: 'weatherapi' };
    const weatherApiHourlyResp = { ...MOCK_HOURLY_RESPONSE, provider: 'weatherapi' };
    const weatherApiDailyResp = { ...MOCK_DAILY_RESPONSE, provider: 'weatherapi' };

    mockProxyFetch.mockImplementation((url: string) => {
      if (url.includes('/current')) return Promise.resolve(makeOkResponse(weatherApiCurrentResp));
      if (url.includes('/hourly')) return Promise.resolve(makeOkResponse(weatherApiHourlyResp));
      if (url.includes('/daily')) return Promise.resolve(makeOkResponse(weatherApiDailyResp));
      if (url.includes('/history')) return Promise.reject(new Error('history gateway timeout'));
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    const result = await weatherService.fetchWeather(TEST_LOCATION, 'weatherapi');
    expectCurrentContract(result.current);
    expectHourlyContract(result.hourlyForecast);
    expectDailyContract(result.dailyForecast);
    expect(result.history).toEqual([]);
  });

  it('歷史頁資料契約：weatherService 應在 Open-Meteo 失敗時 fallback 到 WeatherAPI', async () => {
    const weatherApiHistoryResp = { ...MOCK_HISTORY_RESPONSE, provider: 'weatherapi' };

    mockProxyFetch.mockImplementation((url: string) => {
      // Open-Meteo history → 失敗
      if (url.includes('provider=openmeteo') && url.includes('/history')) {
        return Promise.resolve(makeErrorResponse(500));
      }
      // WeatherAPI history → 成功
      if (url.includes('provider=weatherapi') && url.includes('/history')) {
        return Promise.resolve(makeOkResponse(weatherApiHistoryResp));
      }
      // 其他請求（fetchWeather 的 current/hourly/daily）
      if (url.includes('/current')) return Promise.resolve(makeOkResponse(MOCK_CURRENT_RESPONSE));
      if (url.includes('/hourly')) return Promise.resolve(makeOkResponse(MOCK_HOURLY_RESPONSE));
      if (url.includes('/daily')) return Promise.resolve(makeOkResponse(MOCK_DAILY_RESPONSE));
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    const history = await weatherService.fetchHistory(TEST_LOCATION, 1);
    expectHistoryContract(history);
    expect(history[0]?.source).toBe('weatherapi');
  });
});
