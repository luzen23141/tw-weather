/**
 * 快取 Key 設計
 * 採用 namespace:entity:identifier:qualifier 結構
 */

export const CacheKeys = {
  /**
   * 當前天氣完整資料（包含 hourly + daily）
   * Key: weather:full:{lat},{lon}
   */
  fullWeather: (latitude: number, longitude: number): string =>
    `weather:full:${latitude},${longitude}`,

  /**
   * 單日歷史天氣
   * Key: history:{lat},{lon}:{YYYY-MM-DD}
   */
  historyDay: (latitude: number, longitude: number, date: string): string =>
    `history:${latitude},${longitude}:${date}`,

  /**
   * 歷史天氣索引（記錄快取了哪些日期）
   * Key: history:index:{lat},{lon}
   */
  historyIndex: (latitude: number, longitude: number): string =>
    `history:index:${latitude},${longitude}`,
} as const;
