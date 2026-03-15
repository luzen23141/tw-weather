/**
 * useWeatherPage
 *
 * 統一處理天氣頁面共用的資料狀態邏輯：
 * - 有效地點取得（useEffectiveLocation）
 * - 天氣資料查詢（useWeather）
 * - 合併 loading / error 狀態
 * - 格式化地點顯示名稱
 *
 * 適用於首頁、預報頁等需要天氣資料的頁面。
 */

import { WeatherSource } from '@/api/types';
import { useEffectiveLocation } from '@/hooks/useEffectiveLocation';
import { useWeather } from '@/hooks/useWeather';
import { formatLocationDisplayName, formatLocationSecondaryName } from '@/utils/location-display';

export interface UseWeatherPageOptions {
  /** 強制指定資料源（不傳則使用 settings store 的設定） */
  source?: WeatherSource;
}

export interface UseWeatherPageResult {
  /** 有效地點（null 表示尚未選擇） */
  effectiveLocation: ReturnType<typeof useEffectiveLocation>['effectiveLocation'];
  /** 地點主要顯示名稱（含鄉鎮市區） */
  primaryDisplayName: string;
  /** 地點次要顯示名稱（縣市等） */
  secondaryDisplayName: string | null;
  /** 天氣資料 */
  weatherData: ReturnType<typeof useWeather>['data'];
  /** 合併後的 loading 狀態（location loading 或 weather loading） */
  isLoading: boolean;
  /** 地點取得錯誤 */
  locationError: ReturnType<typeof useEffectiveLocation>['error'];
  /** 天氣資料錯誤 */
  weatherError: ReturnType<typeof useWeather>['error'];
  /** 是否正在重新整理 */
  isRefetching: boolean;
  /** 手動觸發重新整理 */
  refetch: ReturnType<typeof useWeather>['refetch'];
}

export function useWeatherPage(options: UseWeatherPageOptions = {}): UseWeatherPageResult {
  const { source } = options;

  const {
    effectiveLocation,
    displayName,
    isLoading: locationLoading,
    error: locationError,
  } = useEffectiveLocation();

  const {
    data: weatherData,
    isLoading: weatherLoading,
    error: weatherError,
    refetch,
    isRefetching,
  } = useWeather(effectiveLocation, source);

  const isLoading = locationLoading || (!!effectiveLocation && weatherLoading);

  // 主要顯示名稱：優先用鄉鎮市區格式，fallback 到 displayName
  const primaryDisplayName = effectiveLocation
    ? formatLocationDisplayName(effectiveLocation)
    : displayName;

  // 次要顯示名稱：縣市等
  const secondaryDisplayName = effectiveLocation
    ? formatLocationSecondaryName(effectiveLocation)
    : null;

  return {
    effectiveLocation,
    primaryDisplayName,
    secondaryDisplayName,
    weatherData,
    isLoading,
    locationError,
    weatherError,
    isRefetching,
    refetch,
  };
}
