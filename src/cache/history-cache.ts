import { CacheKeys, CacheExpiry, isCacheExpired } from './keys';
import { storage, serializeValue, deserializeValue } from './storage';

import { HistoricalDayWeather } from '@/api/types';

/**
 * 歷史天氣快取索引
 */
interface HistoryIndex {
  /** 已快取的日期列表 (YYYY-MM-DD) */
  cachedDates: string[];

  /** 最後清理時間 */
  lastCleanupTime: number;
}

/**
 * 快取的歷史天氣項目
 */
interface CachedHistoryDay {
  /** 歷史天氣資料 */
  data: HistoricalDayWeather;

  /** 過期時間 */
  expiryTime: number;
}

/**
 * 歷史天氣快取管理器
 *
 * 功能：
 * - 單日快取存取
 * - 範圍查詢快取
 * - 自動清理過期快取
 * - 快取索引管理
 */
export class HistoryCacheManager {
  /**
   * 取得快取的歷史天氣（單日）
   */
  async getHistoryDay(
    latitude: number,
    longitude: number,
    date: string,
  ): Promise<HistoricalDayWeather | null> {
    const key = CacheKeys.historyDay(latitude, longitude, date);

    const cached = await storage.getItem(key);
    if (!cached) return null;

    const parsed = deserializeValue<CachedHistoryDay>(cached);
    if (!parsed) return null;

    // 檢查是否過期（歷史天氣不應過期，但保留此檢查）
    if (isCacheExpired(parsed.expiryTime)) {
      await storage.removeItem(key);
      return null;
    }

    return parsed.data;
  }

  /**
   * 儲存歷史天氣（單日）
   */
  async saveHistoryDay(
    latitude: number,
    longitude: number,
    data: HistoricalDayWeather,
  ): Promise<void> {
    const key = CacheKeys.historyDay(latitude, longitude, data.date);

    const cacheItem: CachedHistoryDay = {
      data,
      expiryTime: Date.now() + CacheExpiry.history,
    };

    await storage.setItem(key, serializeValue(cacheItem));

    // 更新索引
    await this.addToIndex(latitude, longitude, data.date);
  }

  /**
   * 批量儲存歷史天氣
   */
  async saveHistoryRange(
    latitude: number,
    longitude: number,
    dataList: HistoricalDayWeather[],
  ): Promise<void> {
    const promises = dataList.map((data) => this.saveHistoryDay(latitude, longitude, data));
    await Promise.all(promises);
  }

  /**
   * 取得快取的歷史範圍（多日）
   * 回傳已快取的日期和缺失的日期
   */
  async getHistoryRange(
    latitude: number,
    longitude: number,
    days: number,
  ): Promise<{
    cached: HistoricalDayWeather[];
    missingDates: string[];
  }> {
    const cachedData: HistoricalDayWeather[] = [];
    const missingDates: string[] = [];

    // 計算過去 N 天的日期
    for (let i = 0; i < days; i += 1) {
      const date = this.getDateString(i);
      const cached = await this.getHistoryDay(latitude, longitude, date);

      if (cached) {
        cachedData.push(cached);
      } else {
        missingDates.push(date);
      }
    }

    return { cached: cachedData, missingDates };
  }

  /**
   * 清理過期快取
   * 移除超過保留期的歷史資料（所有地點）
   */
  async cleanup(daysToKeep = 30): Promise<void> {
    const allKeys = await storage.getAllKeys();

    // 找出所有歷史索引
    const historyIndexKeys = allKeys.filter((key) => key.startsWith('history:index:'));

    // 遍歷每個地點進行清理
    for (const indexKey of historyIndexKeys) {
      const indexStr = await storage.getItem(indexKey);
      const index = deserializeValue<HistoryIndex>(indexStr);

      if (!index) continue;

      const cutoffDate = this.getDateString(daysToKeep);
      const keysToRemove: string[] = [];

      // 從索引 key 提取 latitude, longitude
      const match = indexKey.match(/history:index:([-\d.]+),([-\d.]+)/);
      if (!match) continue;

      const [, latStr, lonStr] = match;
      const latitude = parseFloat(latStr ?? '0');
      const longitude = parseFloat(lonStr ?? '0');

      // 找出超過保留期的日期
      for (const date of index.cachedDates) {
        if (date < cutoffDate) {
          keysToRemove.push(CacheKeys.historyDay(latitude, longitude, date));
        }
      }

      // 批量移除
      if (keysToRemove.length > 0) {
        await storage.multiRemove(keysToRemove);

        // 更新索引
        const updatedDates = index.cachedDates.filter((date) => date >= cutoffDate);
        await this.saveIndex(latitude, longitude, updatedDates);
      }
    }
  }

  /**
   * 清空某個地點的所有歷史快取
   */
  async clearLocation(latitude: number, longitude: number): Promise<void> {
    const indexKey = CacheKeys.historyIndex(latitude, longitude);
    const indexStr = await storage.getItem(indexKey);
    const index = deserializeValue<HistoryIndex>(indexStr);

    if (!index) return;

    // 移除所有快取項
    const keysToRemove = index.cachedDates.map((date) =>
      CacheKeys.historyDay(latitude, longitude, date),
    );
    keysToRemove.push(indexKey);

    await storage.multiRemove(keysToRemove);
  }

  /**
   * 清空所有歷史快取
   */
  async clearAll(): Promise<void> {
    const allKeys = await storage.getAllKeys();
    const historyKeys = allKeys.filter(
      (key) => key.startsWith('history:') || key.startsWith('timestamp:history:'),
    );

    if (historyKeys.length > 0) {
      await storage.multiRemove(historyKeys);
    }
  }

  /**
   * 取得某個地點已快取的所有日期
   */
  async getAllCachedDates(latitude: number, longitude: number): Promise<string[]> {
    const indexKey = CacheKeys.historyIndex(latitude, longitude);
    const indexStr = await storage.getItem(indexKey);
    const index = deserializeValue<HistoryIndex>(indexStr);

    return index?.cachedDates ?? [];
  }

  /**
   * 獲取快取統計資訊
   */
  async getStats(
    latitude: number,
    longitude: number,
  ): Promise<{
    cachedDays: number;
    oldestDate: string | null;
    newestDate: string | null;
  }> {
    const indexKey = CacheKeys.historyIndex(latitude, longitude);
    const indexStr = await storage.getItem(indexKey);
    const index = deserializeValue<HistoryIndex>(indexStr);

    if (!index || index.cachedDates.length === 0) {
      return { cachedDays: 0, oldestDate: null, newestDate: null };
    }

    const sorted = [...index.cachedDates].sort();

    return {
      cachedDays: sorted.length,
      oldestDate: sorted[0] ?? null,
      newestDate: sorted[sorted.length - 1] ?? null,
    };
  }

  /**
   * 私有方法：新增日期到索引
   */
  private async addToIndex(latitude: number, longitude: number, date: string): Promise<void> {
    const indexKey = CacheKeys.historyIndex(latitude, longitude);
    const indexStr = await storage.getItem(indexKey);
    const index = deserializeValue<HistoryIndex>(indexStr) || {
      cachedDates: [],
      lastCleanupTime: Date.now(),
    };

    // 避免重複
    if (!index.cachedDates.includes(date)) {
      index.cachedDates.push(date);
    }

    await this.saveIndex(latitude, longitude, index.cachedDates);
  }

  /**
   * 私有方法：儲存索引
   */
  private async saveIndex(
    latitude: number,
    longitude: number,
    cachedDates: string[],
  ): Promise<void> {
    const indexKey = CacheKeys.historyIndex(latitude, longitude);
    const index: HistoryIndex = {
      cachedDates,
      lastCleanupTime: Date.now(),
    };

    await storage.setItem(indexKey, serializeValue(index));
  }

  /**
   * 私用方法：取得日期字串（YYYY-MM-DD）
   * @param daysAgo 多少天前（0 = 今天，1 = 昨天）
   */
  private getDateString(daysAgo: number): string {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);

    const dateStr = date.toISOString().split('T')[0];
    return dateStr ?? '';
  }
}

/**
 * 單例歷史快取管理器
 */
export const historyCache = new HistoryCacheManager();
