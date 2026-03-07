import { useQuery } from '@tanstack/react-query';

import {
  DEFAULT_AGGREGATION_CONFIG,
  type Location,
  type LocationDisplayFormat,
  type WeatherData,
  type WeatherSource,
} from '@/api/types';
import { weatherService } from '@/api/weather.service';
import { useWeather } from '@/hooks/useWeather';
import { useSettingsStore } from '@/store/settings.store';

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
}));

jest.mock('@/api/weather.service', () => ({
  weatherService: {
    fetchWeather: jest.fn(),
    fetchAggregated: jest.fn(),
  },
}));

jest.mock('@/store/settings.store', () => ({
  useSettingsStore: jest.fn(),
}));

const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>;
const mockFetchWeather = weatherService.fetchWeather as jest.MockedFunction<
  typeof weatherService.fetchWeather
>;
const mockFetchAggregated = weatherService.fetchAggregated as jest.MockedFunction<
  typeof weatherService.fetchAggregated
>;
const mockUseSettingsStore = useSettingsStore as jest.MockedFunction<typeof useSettingsStore>;

type CapturedQueryOptions = {
  queryKey: unknown[];
  queryFn: () => Promise<WeatherData>;
  staleTime?: number;
};

let capturedQueryOptions: CapturedQueryOptions | null = null;

const mockLocation: Location = {
  name: '台北市信義區',
  city: '台北市',
  district: '信義區',
  latitude: 25.033,
  longitude: 121.5654,
};

const mockWeatherData: WeatherData = {
  location: mockLocation,
  source: 'cwa',
  fetchedAt: '2026-03-07T00:00:00.000Z',
  current: {
    timestamp: '2026-03-07T00:00:00.000Z',
    temperature: 24,
    apparentTemperature: 25,
    humidity: 70,
    description: '多雲',
    weatherCode: 3,
    windSpeed: 5,
    windDirection: 180,
    precipitation: 0,
    precipitationProbability: 10,
  },
  hourlyForecast: [],
  dailyForecast: [],
  history: [],
};

function mockStoreState(overrides?: {
  displayMode?: 'single' | 'aggregate';
  activeSource?: WeatherSource;
  enabledSources?: WeatherSource[];
}) {
  const state = {
    theme: 'system' as const,
    temperatureUnit: 'celsius' as const,
    windSpeedUnit: 'kmh' as const,
    locationDisplayFormat: 'township' as LocationDisplayFormat,
    displayMode: overrides?.displayMode ?? 'single',
    activeSource: overrides?.activeSource ?? 'cwa',
    enabledSources: overrides?.enabledSources ?? ['cwa', 'open-meteo'],
    refreshIntervalMinutes: 5,
    setRefreshIntervalMinutes: jest.fn(),
    setTheme: jest.fn(),
    setTemperatureUnit: jest.fn(),
    setWindSpeedUnit: jest.fn(),
    setLocationDisplayFormat: jest.fn(),
    setDisplayMode: jest.fn(),
    setActiveSource: jest.fn(),
    toggleSource: jest.fn(),
  };

  mockUseSettingsStore.mockImplementation((selector) => selector(state));
}

describe('useWeather', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedQueryOptions = null;
    mockUseQuery.mockImplementation((options) => {
      capturedQueryOptions = options as unknown as CapturedQueryOptions;
      return { data: undefined, isLoading: false, error: null } as unknown as ReturnType<
        typeof useQuery
      >;
    });
  });

  it('single 模式應呼叫 fetchWeather 並使用 single query key', async () => {
    mockStoreState({ displayMode: 'single', activeSource: 'weatherapi' });
    mockFetchWeather.mockResolvedValue(mockWeatherData);

    useWeather(mockLocation);
    const queryOptions = capturedQueryOptions;

    expect(queryOptions?.queryKey).toEqual([
      'weather:full:25.033,121.5654',
      'single',
      'weatherapi',
    ]);

    const data = await queryOptions?.queryFn?.();

    expect(mockFetchWeather).toHaveBeenCalledWith(mockLocation, 'weatherapi');
    expect(mockFetchAggregated).not.toHaveBeenCalled();
    expect(data).toBe(mockWeatherData);
  });

  it('aggregate 模式應呼叫 fetchAggregated 並使用 aggregate query key', async () => {
    mockStoreState({
      displayMode: 'aggregate',
      activeSource: 'cwa',
      enabledSources: ['open-meteo', 'cwa'],
    });
    mockFetchAggregated.mockResolvedValue({ ...mockWeatherData, source: 'aggregate' });

    useWeather(mockLocation);
    const queryOptions = capturedQueryOptions;

    expect(queryOptions?.queryKey).toEqual([
      'weather:full:25.033,121.5654',
      'aggregate',
      'cwa,open-meteo',
    ]);

    const data = await queryOptions?.queryFn?.();

    expect(mockFetchAggregated).toHaveBeenCalledWith(
      mockLocation,
      ['cwa', 'open-meteo'],
      DEFAULT_AGGREGATION_CONFIG,
    );
    expect(mockFetchWeather).not.toHaveBeenCalled();
    expect(data?.source).toBe('aggregate');
  });

  it('應依設定 refreshIntervalMinutes 設定 staleTime', () => {
    mockStoreState({ displayMode: 'single', activeSource: 'cwa' });

    useWeather(mockLocation);
    const queryOptions = capturedQueryOptions;

    expect(queryOptions?.staleTime).toBe(5 * 60 * 1000);
  });

  it('傳入 source 時應強制走 single 模式', async () => {
    mockStoreState({
      displayMode: 'aggregate',
      activeSource: 'cwa',
      enabledSources: ['cwa', 'open-meteo'],
    });
    mockFetchWeather.mockResolvedValue({ ...mockWeatherData, source: 'open-meteo' });

    useWeather(mockLocation, 'open-meteo');
    const queryOptions = capturedQueryOptions;

    expect(queryOptions?.queryKey).toEqual([
      'weather:full:25.033,121.5654',
      'single',
      'open-meteo',
    ]);

    await queryOptions?.queryFn?.();

    expect(mockFetchWeather).toHaveBeenCalledWith(mockLocation, 'open-meteo');
    expect(mockFetchAggregated).not.toHaveBeenCalled();
  });
});
