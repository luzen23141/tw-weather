import cwaAdapter from '../cwa.adapter';
import { Location } from '../../types';

// Mock proxyFetch
jest.mock('@/api/proxy-fetch', () => ({
  buildWeatherUrl: jest.fn(
    (endpoint: string, params: Record<string, string>) =>
      `https://proxy.test/api/weather/${endpoint}?${new URLSearchParams(params).toString()}`,
  ),
  proxyFetch: jest.fn(),
}));

import { proxyFetch } from '@/api/proxy-fetch';

const mockProxyFetch = proxyFetch as jest.MockedFunction<typeof proxyFetch>;

const mockLocation: Location = {
  name: '台北市',
  latitude: 25.048,
  longitude: 121.517,
};

const mockCurrentResponse = {
  provider: 'cwa',
  type: 'current',
  location: { name: '崇德', lat: 24.166, lon: 121.657 },
  updatedAt: '2026-03-11T17:00:00+08:00',
  current: {
    temperature: 19.7,
    apparentTemperature: 18.5,
    humidity: 65,
    windSpeed: 9.0,
    windDirection: 37,
    pressure: 1016.3,
    visibility: 10.0,
    weatherCode: 3,
    description: '陰',
  },
};

const mockHourlyResponse = {
  provider: 'cwa',
  type: 'hourly',
  location: { name: '大安區', lat: 25.026, lon: 121.543 },
  updatedAt: '2026-03-11T17:00:00+08:00',
  hourly: [
    {
      time: '2026-03-11T18:00:00+08:00',
      temperature: 18.0,
      humidity: 75,
      windSpeed: 12.6,
      windDirection: 45,
      precipProb: 20,
      weatherCode: 3,
      description: '陰',
    },
  ],
};

const mockDailyResponse = {
  provider: 'cwa',
  type: 'daily',
  location: { name: '大安區', lat: 25.026, lon: 121.543 },
  updatedAt: '2026-03-11T17:00:00+08:00',
  daily: [
    {
      date: '2026-03-11T00:00:00Z',
      tempMax: 22.0,
      tempMin: 15.0,
      precipProb: 10,
      weatherCode: 0,
      description: '晴',
    },
  ],
};

function makeOkResponse(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: () => Promise.resolve(body),
  } as unknown as Response;
}

describe('CwaAdapter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.EXPO_PUBLIC_PROXY_URL = 'https://proxy.test';
  });

  it('should call /api/weather/current, /hourly, /daily in parallel', async () => {
    mockProxyFetch
      .mockResolvedValueOnce(makeOkResponse(mockCurrentResponse))
      .mockResolvedValueOnce(makeOkResponse(mockHourlyResponse))
      .mockResolvedValueOnce(makeOkResponse(mockDailyResponse));

    await cwaAdapter.fetchWeather(mockLocation);

    expect(mockProxyFetch).toHaveBeenCalledTimes(3);
    const urls = mockProxyFetch.mock.calls.map(([url]) => url);
    expect(urls.some((u) => u.includes('/current'))).toBe(true);
    expect(urls.some((u) => u.includes('/hourly'))).toBe(true);
    expect(urls.some((u) => u.includes('/daily'))).toBe(true);
  });

  it('should pass provider=cwa and lat/lon to all endpoints', async () => {
    mockProxyFetch
      .mockResolvedValueOnce(makeOkResponse(mockCurrentResponse))
      .mockResolvedValueOnce(makeOkResponse(mockHourlyResponse))
      .mockResolvedValueOnce(makeOkResponse(mockDailyResponse));

    await cwaAdapter.fetchWeather(mockLocation);

    for (const [url] of mockProxyFetch.mock.calls) {
      expect(url).toContain('provider=cwa');
      expect(url).toContain('lat=25.048');
      expect(url).toContain('lon=121.517');
    }
  });

  it('should return correct current weather from proxy response', async () => {
    mockProxyFetch
      .mockResolvedValueOnce(makeOkResponse(mockCurrentResponse))
      .mockResolvedValueOnce(makeOkResponse(mockHourlyResponse))
      .mockResolvedValueOnce(makeOkResponse(mockDailyResponse));

    const result = await cwaAdapter.fetchWeather(mockLocation);

    expect(result.current.temperature).toBe(19.7);
    expect(result.current.humidity).toBe(65);
    expect(result.current.windSpeed).toBe(9.0);
    expect(result.current.weatherCode).toBe(3);
    expect(result.current.description).toBe('陰');
  });

  it('should return correct hourly forecast', async () => {
    mockProxyFetch
      .mockResolvedValueOnce(makeOkResponse(mockCurrentResponse))
      .mockResolvedValueOnce(makeOkResponse(mockHourlyResponse))
      .mockResolvedValueOnce(makeOkResponse(mockDailyResponse));

    const result = await cwaAdapter.fetchWeather(mockLocation);

    expect(result.hourlyForecast).toHaveLength(1);
    const first = result.hourlyForecast[0];
    expect(first?.temperature).toBe(18.0);
    expect(first?.precipitationProbability).toBe(20);
  });

  it('should return correct daily forecast with YYYY-MM-DD date', async () => {
    mockProxyFetch
      .mockResolvedValueOnce(makeOkResponse(mockCurrentResponse))
      .mockResolvedValueOnce(makeOkResponse(mockHourlyResponse))
      .mockResolvedValueOnce(makeOkResponse(mockDailyResponse));

    const result = await cwaAdapter.fetchWeather(mockLocation);

    expect(result.dailyForecast).toHaveLength(1);
    const first = result.dailyForecast[0];
    expect(first?.date).toBe('2026-03-11');
    expect(first?.temperatureMax).toBe(22.0);
    expect(first?.temperatureMin).toBe(15.0);
  });

  it('should set source to "cwa"', async () => {
    mockProxyFetch
      .mockResolvedValueOnce(makeOkResponse(mockCurrentResponse))
      .mockResolvedValueOnce(makeOkResponse(mockHourlyResponse))
      .mockResolvedValueOnce(makeOkResponse(mockDailyResponse));

    const result = await cwaAdapter.fetchWeather(mockLocation);
    expect(result.source).toBe('cwa');
  });

  it('should return empty array from fetchHistory', async () => {
    const history = await cwaAdapter.fetchHistory?.();
    expect(history).toEqual([]);
  });

  it('should throw WeatherApiError when endpoint returns non-ok', async () => {
    mockProxyFetch.mockResolvedValue({
      ok: false,
      status: 502,
      statusText: 'Bad Gateway',
    } as unknown as Response);

    await expect(cwaAdapter.fetchWeather(mockLocation)).rejects.toMatchObject({
      source: 'cwa',
    });
  });

  it('should wrap unexpected errors in WeatherApiError', async () => {
    mockProxyFetch.mockRejectedValue(new Error('network failure'));

    await expect(cwaAdapter.fetchWeather(mockLocation)).rejects.toMatchObject({
      source: 'cwa',
      message: expect.stringContaining('network failure'),
    });
  });
});
