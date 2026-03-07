import { useQuery } from '@tanstack/react-query';

import { type HistoricalDayWeather, type Location } from '@/api/types';
import { MAX_HISTORY_FETCH_DAYS, weatherService } from '@/api/weather.service';
import { historyCache } from '@/cache/history-cache';
import { useHistory } from '@/hooks/useHistory';
import { useSettingsStore } from '@/store/settings.store';

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
}));

jest.mock('@/api/weather.service', () => ({
  MAX_HISTORY_FETCH_DAYS: 7,
  weatherService: {
    fetchHistory: jest.fn(),
  },
}));

jest.mock('@/cache/history-cache', () => ({
  historyCache: {
    getHistoryRange: jest.fn(),
    saveHistoryRange: jest.fn(),
  },
}));

jest.mock('@/store/settings.store', () => ({
  useSettingsStore: jest.fn(),
}));

type UseQueryArg = {
  queryKey: unknown[];
  staleTime: number;
  queryFn: () => Promise<HistoricalDayWeather[]>;
};

const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>;
const mockFetchHistory = weatherService.fetchHistory as jest.MockedFunction<
  typeof weatherService.fetchHistory
>;
const mockGetHistoryRange = historyCache.getHistoryRange as jest.MockedFunction<
  typeof historyCache.getHistoryRange
>;
const mockSaveHistoryRange = historyCache.saveHistoryRange as jest.MockedFunction<
  typeof historyCache.saveHistoryRange
>;
const mockUseSettingsStore = useSettingsStore as jest.MockedFunction<typeof useSettingsStore>;

const mockLocation: Location = {
  name: '台北市信義區',
  city: '台北市',
  district: '信義區',
  latitude: 25.033,
  longitude: 121.5654,
};

const makeHistory = (count: number): HistoricalDayWeather[] =>
  Array.from({ length: count }, (_, index) => ({
    date: `2026-03-${String(7 - index).padStart(2, '0')}`,
    temperatureMax: 25,
    temperatureMin: 19,
    temperatureAvg: 22,
    weatherCode: 1,
    description: '晴時多雲',
    precipitationSum: 0,
    windSpeedAvg: 10,
    humidityAvg: 70,
    source: 'open-meteo',
  }));

describe('useHistory', () => {
  let captured: UseQueryArg | null = null;

  beforeEach(() => {
    jest.clearAllMocks();
    captured = null;

    mockUseSettingsStore.mockImplementation(((
      selector: (state: { refreshIntervalMinutes: number }) => number,
    ) => selector({ refreshIntervalMinutes: 5 })) as typeof useSettingsStore);

    mockUseQuery.mockImplementation((options) => {
      captured = options as unknown as UseQueryArg;
      return { data: undefined, isLoading: false, error: null } as unknown as ReturnType<
        typeof useQuery
      >;
    });
  });

  it('days 大於上限時 query key 應收斂到 7 天', () => {
    useHistory(mockLocation, 30);

    expect(captured?.queryKey).toEqual(['history:25.033,121.5654:range', MAX_HISTORY_FETCH_DAYS]);
  });

  it('應以 refreshIntervalMinutes 控制 staleTime', () => {
    useHistory(mockLocation, 7);

    expect(captured?.staleTime).toBe(5 * 60 * 1000);
  });

  it('快取缺資料時應以收斂後天數呼叫 fetchHistory', async () => {
    const cached = makeHistory(1);
    const fetched = makeHistory(7);

    mockGetHistoryRange.mockResolvedValue({ cached, missingDates: ['2026-03-01'] });
    mockFetchHistory.mockResolvedValue(fetched);
    mockSaveHistoryRange.mockResolvedValue();

    useHistory(mockLocation, 30);

    const result = await captured?.queryFn();

    expect(mockGetHistoryRange).toHaveBeenCalledWith(25.033, 121.5654, 7);
    expect(mockFetchHistory).toHaveBeenCalledWith(mockLocation, 7);
    expect(mockSaveHistoryRange).toHaveBeenCalled();
    expect(result?.length).toBeGreaterThan(0);
  });
});
