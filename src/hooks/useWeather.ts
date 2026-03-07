import { useQuery } from '@tanstack/react-query';

import {
  DEFAULT_AGGREGATION_CONFIG,
  Location,
  WeatherData,
  WeatherDisplayMode,
  WeatherSource,
} from '@/api/types';
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
  const displayMode = useSettingsStore((s) => s.displayMode);
  const activeSource = useSettingsStore((s) => s.activeSource);
  const enabledSources = useSettingsStore((s) => s.enabledSources);
  const refreshIntervalMinutes = useSettingsStore((s) => s.refreshIntervalMinutes);

  const effectiveSource = source || activeSource;
  const effectiveDisplayMode: WeatherDisplayMode = source ? 'single' : displayMode;
  const effectiveEnabledSources =
    effectiveDisplayMode === 'aggregate' ? [...enabledSources].sort() : [effectiveSource];
  const sourceKey =
    effectiveDisplayMode === 'aggregate' ? effectiveEnabledSources.join(',') : effectiveSource;

  return useQuery({
    queryKey: [
      CacheKeys.fullWeather(location?.latitude ?? 0, location?.longitude ?? 0),
      effectiveDisplayMode,
      sourceKey,
    ],
    queryFn: async (): Promise<WeatherData> => {
      if (!location) {
        throw new Error('地點未定義');
      }

      if (effectiveDisplayMode === 'aggregate') {
        return await weatherService.fetchAggregated(
          location,
          effectiveEnabledSources,
          DEFAULT_AGGREGATION_CONFIG,
        );
      }

      return await weatherService.fetchWeather(location, effectiveSource);
    },
    enabled: !!location,
    staleTime: Math.max(1, refreshIntervalMinutes) * 60 * 1000,
    gcTime: 30 * 60 * 1000, // 30 分鐘
    retry: 2,
    refetchOnWindowFocus: false,
  });
}
