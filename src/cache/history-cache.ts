import { CacheKeys } from './keys';
import { storage, serializeValue, deserializeValue } from './storage';

import { HistoricalDayWeather } from '@/api/types';

/**
 * 歷史天氣快取索引
 */
interface HistoryIndex {
  /** 已快取的日期列表 (YYYY-MM-DD) */
  cachedDates: string[];
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
 * - 範圍查詢快取（索引化，避免全量掃描）
 * - 批次寫入（saveHistoryRange 一次更新索引）
 * - 自動清理過期快取
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

    if (Date.now() > parsed.expiryTime) {
      await storage.removeItem(key);
      return null;
    }

    return parsed.data;
  }

  /**
   * 儲存歷史天氣（單日）
   * 注意：單筆儲存會立即更新索引，批量請用 saveHistoryRange
   */
  async saveHistoryDay(
    latitude: number,
    longitude: number,
    data: HistoricalDayWeather,
  ): Promise<void> {
    const key = CacheKeys.historyDay(latitude, longitude, data.date);

    const cacheItem: CachedHistoryDay = {
      data,
      expiryTime: Infinity,
    };

    await storage.setItem(key, serializeValue(cacheItem));
    await this.addManyToIndex(latitude, longitude, [data.date]);
  }

  /**
   * 批量儲存歷史天氣
   * 優化：並行寫入所有資料後，一次更新索引（避免每筆都讀寫索引）
   */
  async saveHistoryRange(
    latitude: number,
    longitude: number,
    dataList: HistoricalDayWeather[],
  ): Promise<void> {
    if (dataList.length === 0) return;

    const expiryTime = Infinity;

    // 並行寫入所有資料（不更新索引）
    await Promise.all(
      dataList.map((data) => {
        const key = CacheKeys.historyDay(latitude, longitude, data.date);
        const cacheItem: CachedHistoryDay = { data, expiryTime };
        return storage.setItem(key, serializeValue(cacheItem));
      }),
    );

    // 一次更新索引
    const dates = dataList.map((d) => d.date);
    await this.addManyToIndex(latitude, longitude, dates);
  }

  /**
   * 取得快取的歷史範圍（多日）
   * 優化：先讀索引確認哪些日期已快取，再批次讀取，避免逐日 await
   */
  async getHistoryRange(
    latitude: number,
    longitude: number,
    days: number,
  ): Promise<{
    cached: HistoricalDayWeather[];
    missingDates: string[];
  }> {
    // 計算過去 N 天的日期，**從昨天起算**（i+1）而非今天。
    // 歷史資料源（archive）不含當日觀測 —— 從今天起算會浪費一格在永遠取不到的
    // 今天上，days=2 實際只拿得到昨天一天。從昨天起算才是「最近 N 天的觀測」。
    const requestedDates = Array.from({ length: days }, (_, i) => this.getDateString(i + 1));

    // 讀取索引，確認哪些日期已快取
    const index = await this.readIndex(latitude, longitude);
    const cachedDateSet = new Set(index?.cachedDates ?? []);

    const datesToFetch = requestedDates.filter((d) => cachedDateSet.has(d));
    const missingDates = requestedDates.filter((d) => !cachedDateSet.has(d));

    // 批次讀取已快取的日期
    const cachedResults = await Promise.all(
      datesToFetch.map((date) => this.getHistoryDay(latitude, longitude, date)),
    );

    // 過濾掉 null（可能因過期被移除）
    const cached = cachedResults.filter((d): d is HistoricalDayWeather => d !== null);

    // 若有日期因過期被移除，補回 missingDates
    const actualCachedDates = new Set(cached.map((d) => d.date));
    for (const date of datesToFetch) {
      if (!actualCachedDates.has(date)) {
        missingDates.push(date);
      }
    }

    return { cached, missingDates };
  }

  /**
   * 清理過期快取
   * 移除超過保留期的歷史資料（所有地點）
   * 優化：使用索引而非全量掃描 storage keys
   */
  async cleanup(daysToKeep = 30): Promise<void> {
    const allKeys = await storage.getAllKeys();

    // 找出所有歷史索引 key
    const historyIndexKeys = allKeys.filter((key) => key.startsWith('history:index:'));

    // 並行處理每個地點
    await Promise.all(
      historyIndexKeys.map(async (indexKey) => {
        const indexStr = await storage.getItem(indexKey);
        const index = deserializeValue<HistoryIndex>(indexStr);
        if (!index) return;

        const cutoffDate = this.getDateString(daysToKeep);

        // 從索引 key 提取 latitude, longitude
        const match = indexKey.match(/history:index:([-\d.]+),([-\d.]+)/);
        if (!match) return;

        const [, latStr, lonStr] = match;
        const latitude = parseFloat(latStr ?? '0');
        const longitude = parseFloat(lonStr ?? '0');

        const datesToRemove = index.cachedDates.filter((date) => date < cutoffDate);
        if (datesToRemove.length === 0) return;

        const keysToRemove = datesToRemove.map((date) =>
          CacheKeys.historyDay(latitude, longitude, date),
        );

        await storage.multiRemove(keysToRemove);

        // 更新索引
        const updatedDates = index.cachedDates.filter((date) => date >= cutoffDate);
        await this.saveIndex(latitude, longitude, updatedDates);
      }),
    );
  }

  /**
   * 清空某個地點的所有歷史快取
   */
  async clearLocation(latitude: number, longitude: number): Promise<void> {
    const index = await this.readIndex(latitude, longitude);
    if (!index) return;

    const indexKey = CacheKeys.historyIndex(latitude, longitude);
    const keysToRemove = [
      ...index.cachedDates.map((date) => CacheKeys.historyDay(latitude, longitude, date)),
      indexKey,
    ];

    await storage.multiRemove(keysToRemove);
  }

  /**
   * 清空所有歷史快取
   */
  async clearAll(): Promise<void> {
    const allKeys = await storage.getAllKeys();
    const historyKeys = allKeys.filter((key) => key.startsWith('history:'));

    if (historyKeys.length > 0) {
      await storage.multiRemove(historyKeys);
    }
  }

  /**
   * 私有方法：讀取索引
   */
  private async readIndex(latitude: number, longitude: number): Promise<HistoryIndex | null> {
    const indexKey = CacheKeys.historyIndex(latitude, longitude);
    const indexStr = await storage.getItem(indexKey);
    return deserializeValue<HistoryIndex>(indexStr);
  }

  /**
   * 私有方法：批次新增日期到索引（一次讀寫，避免重複 I/O）
   */
  private async addManyToIndex(
    latitude: number,
    longitude: number,
    dates: string[],
  ): Promise<void> {
    const index = (await this.readIndex(latitude, longitude)) ?? { cachedDates: [] };

    const existingSet = new Set(index.cachedDates);
    for (const date of dates) {
      existingSet.add(date);
    }

    await this.saveIndex(latitude, longitude, [...existingSet]);
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
    const index: HistoryIndex = { cachedDates };

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
