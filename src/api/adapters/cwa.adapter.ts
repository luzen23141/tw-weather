import { HistoricalDayWeather, WeatherSource } from '../types';

import { BaseProxyAdapter } from './base-proxy.adapter';

/**
 * CWA (中央氣象署) API Adapter
 *
 * 透過 proxy_golang /api/weather/* 取得資料：
 * - /api/weather/current  → 即時天氣
 * - /api/weather/hourly   → 逐時預報
 * - /api/weather/daily    → 每日預報
 *
 * CWA 不支援歷史資料，fetchHistory 回傳空陣列。
 */
class CwaAdapter extends BaseProxyAdapter {
  readonly source: WeatherSource = 'cwa';

  protected override get displayName(): string {
    return 'CWA';
  }

  async fetchHistory?(): Promise<HistoricalDayWeather[]> {
    return [];
  }
}

export default new CwaAdapter();
