import { useQuery, UseQueryResult } from '@tanstack/react-query';

import { HistoricalDayWeather, Location } from '@/api/types';
import { weatherService } from '@/api/weather.service';
import { historyCache } from '@/cache/history-cache';
import { CacheKeys } from '@/cache/keys';

/**
 * useHistory Hook
 *
 * 使用 TanStack Query 取得歷史天氣資料
 * 整合本地快取（historyCache）以支援離線模式
 *
 * 策略：
 * 1. 查詢本地快取（historyCache）
 * 2. 如有缺失日期，呼叫 weatherService.fetchHistory
 * 3. 將新取得的資料存入快取
 * 4. 回傳完整的歷史資料
 */
export function useHistory(
  location: Location | null,
  days = 7,
): UseQueryResult<HistoricalDayWeather[], Error> {
  return useQuery({
    queryKey: [
      CacheKeys.historyDay(location?.latitude ?? 0, location?.longitude ?? 0, 'range'),
      days,
    ],
    queryFn: async () => {
      if (!location) {
        throw new Error('地點未定義');
      }

      // 步驟 1：查詢本地快取
      const { cached, missingDates } = await historyCache.getHistoryRange(
        location.latitude,
        location.longitude,
        days,
      );

      // 如果所有日期都已快取，直接回傳
      if (missingDates.length === 0) {
        return cached.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      }

      // 步驟 2：取得缺失的資料
      let fetchedData: HistoricalDayWeather[] = [];
      try {
        fetchedData = await weatherService.fetchHistory(location, days);

        // 驗證回傳的資料不為空
        if (!fetchedData || fetchedData.length === 0) {
          console.warn('API 返回空的歷史資料');
          if (cached.length === 0) {
            throw new Error('無法取得歷史資料');
          }
          return cached.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        }

        // 步驟 3：存入快取
        await historyCache.saveHistoryRange(location.latitude, location.longitude, fetchedData);
      } catch (error) {
        // 如果取得失敗，就使用快取中的資料
        console.warn(
          `歷史資料取得失敗，使用快取資料: ${error instanceof Error ? error.message : '未知錯誤'}`,
        );
        if (cached.length === 0) {
          throw error;
        }
      }

      // 步驟 4：合併快取和新取得的資料
      const allData = [...cached, ...fetchedData];

      // 移除重複
      const uniqueData = Array.from(new Map(allData.map((item) => [item.date, item])).values());

      // 按日期降序排列（最新的在前）
      return uniqueData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    },
    enabled: !!location,
    staleTime: 30 * 60 * 1000, // 30 分鐘
    gcTime: 3 * 60 * 60 * 1000, // 3 小時
    retry: 1,
    refetchOnWindowFocus: false,
  });
}

/**
 * useHistoryDay Hook
 *
 * 取得單一日期的歷史天氣資料
 */
export function useHistoryDay(
  location: Location | null,
  date: string,
): UseQueryResult<HistoricalDayWeather | null, Error> {
  return useQuery({
    queryKey: [CacheKeys.historyDay(location?.latitude ?? 0, location?.longitude ?? 0, date)],
    queryFn: async () => {
      if (!location) {
        throw new Error('地點未定義');
      }

      // 查詢快取
      const cached = await historyCache.getHistoryDay(location.latitude, location.longitude, date);

      if (cached) {
        return cached;
      }

      // 快取未命中，從 API 取得
      try {
        const data = await weatherService.fetchHistory(location, 7);
        const found = data.find((item) => item.date === date);

        if (found) {
          // 存入快取
          await historyCache.saveHistoryDay(location.latitude, location.longitude, found);
        }

        return found || null;
      } catch (error) {
        console.warn(`歷史資料取得失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
        return null;
      }
    },
    enabled: !!location,
    staleTime: 60 * 60 * 1000, // 1 小時
    gcTime: 24 * 60 * 60 * 1000, // 1 天
    retry: 1,
    refetchOnWindowFocus: false,
  });
}

/**
 * 手動清理歷史快取（用於設定頁或首選項變更）
 */
export async function clearHistoryCache(location: Location): Promise<void> {
  await historyCache.clearLocation(location.latitude, location.longitude);
}

/**
 * 清理所有歷史快取
 */
export async function clearAllHistoryCache(): Promise<void> {
  await historyCache.clearAll();
}

/**
 * 取得快取統計資訊
 */
export async function getHistoryCacheStats(location: Location): Promise<{
  cachedDays: number;
  oldestDate: string | null;
  newestDate: string | null;
}> {
  return await historyCache.getStats(location.latitude, location.longitude);
}
