import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

function computeSourceKey(
  displayMode: WeatherDisplayMode,
  enabledSources: WeatherSource[],
  effectiveSource: WeatherSource,
): { effectiveEnabledSources: WeatherSource[]; sourceKey: string } {
  const sources = displayMode === 'aggregate' ? [...enabledSources].sort() : [effectiveSource];
  const key = displayMode === 'aggregate' ? sources.join(',') : effectiveSource;
  return { effectiveEnabledSources: sources, sourceKey: key };
}

import { Location, WeatherData, WeatherDisplayMode, WeatherSource } from '@/api/types';
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
  const aggregationConfig = useSettingsStore((s) => s.aggregationConfig);
  const effectiveSource = source || activeSource;
  const effectiveDisplayMode: WeatherDisplayMode = source ? 'single' : displayMode;
  const { effectiveEnabledSources, sourceKey } = useMemo(
    () => computeSourceKey(effectiveDisplayMode, enabledSources, effectiveSource),
    [effectiveDisplayMode, enabledSources, effectiveSource],
  );

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
          aggregationConfig,
        );
      }

      return await weatherService.fetchWeather(location, effectiveSource);
    },
    enabled: !!location,
    staleTime: 30 * 60 * 1000,
    gcTime: 30 * 60 * 1000, // 30 分鐘
    retry: 2,
    refetchOnWindowFocus: false,
  });
}
