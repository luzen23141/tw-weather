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

  /**
   * 使用者設定
   * Key: app:settings
   */
  settings: 'app:settings',

  /**
   * 收藏地點
   * Key: app:locations
   */
  savedLocations: 'app:locations',

  /**
   * 查詢時間戳（用於追蹤最後更新時間）
   * Key: timestamp:{key}
   */
  timestamp: (key: string): string => `timestamp:${key}`,
} as const;

/**
 * 快取過期時間配置（毫秒）
 */
export const CacheExpiry = {
  /** 完整天氣資料：30 分鐘 */
  fullWeather: 30 * 60 * 1000,

  /** 歷史天氣：永不過期（過去天氣不會改變） */
  history: Number.MAX_SAFE_INTEGER,

  /** 設定：永久 */
  settings: Number.MAX_SAFE_INTEGER,

  /** 地點：永久 */
  locations: Number.MAX_SAFE_INTEGER,
} as const;

/**
 * 計算快取過期時間
 */
export function getExpiryTime(keyType: keyof typeof CacheExpiry): number {
  return Date.now() + CacheExpiry[keyType];
}

/**
 * 檢查快取是否過期
 */
export function isCacheExpired(expiryTime: number): boolean {
  return Date.now() > expiryTime;
}
