import { useQuery } from '@tanstack/react-query';

import { Location, WeatherData, WeatherSource } from '@/api/types';
import { weatherService } from '@/api/weather.service';
import { CacheKeys } from '@/cache/keys';
import { useSettingsStore } from '@/store/settings.store';

/**
 * useWeather Hook
 *
 * 使用 TanStack Query 取得天氣資料
 * 自動處理快取、重試、背景重新取得等
 */
export function useWeather(location: Location | null, source?: WeatherSource) {
  const activeSource = useSettingsStore((s) => s.activeSource);
  const effectiveSource = source || activeSource;

  return useQuery({
    queryKey: [
      CacheKeys.fullWeather(location?.latitude ?? 0, location?.longitude ?? 0),
      effectiveSource,
    ],
    queryFn: async (): Promise<WeatherData> => {
      if (!location) {
        throw new Error('地點未定義');
      }

      // 單一來源模式（暫時移除聚合邏輯，交由任務 #17）
      return await weatherService.fetchWeather(location, effectiveSource);
    },
    enabled: !!location,
    staleTime: 5 * 60 * 1000, // 5 分鐘
    gcTime: 30 * 60 * 1000, // 30 分鐘
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

/**
 * useCurrentWeather Hook
 *
 * 只取得當前天氣資料
 */
export function useCurrentWeather(location: Location | null, source?: WeatherSource) {
  const query = useWeather(location, source);

  return {
    ...query,
    data: query.data
      ? {
          ...query.data,
          hourlyForecast: [],
          dailyForecast: [],
        }
      : undefined,
  };
}

/**
 * useHourlyForecast Hook
 *
 * 只取得逐時預報資料
 */
export function useHourlyForecast(location: Location | null, source?: WeatherSource) {
  const query = useWeather(location, source);

  return {
    ...query,
    data: query.data
      ? {
          ...query.data,
          dailyForecast: [],
        }
      : undefined,
  };
}

/**
 * useDailyForecast Hook
 *
 * 只取得每日預報資料
 */
export function useDailyForecast(location: Location | null, source?: WeatherSource) {
  const query = useWeather(location, source);

  return {
    ...query,
    data: query.data
      ? {
          ...query.data,
          hourlyForecast: [],
        }
      : undefined,
  };
}
