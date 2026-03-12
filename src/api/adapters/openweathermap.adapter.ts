import { HistoricalDayWeather, WeatherSource } from '../types';

import { BaseProxyAdapter } from './base-proxy.adapter';

/**
 * OpenWeatherMap Adapter
 *
 * 透過 proxy_golang /api/weather/* 取得資料：
 * - /api/weather/current  → 即時天氣
 * - /api/weather/hourly   → 逐時預報
 * - /api/weather/daily    → 每日預報
 *
 * OpenWeatherMap 免費版不支援歷史查詢，fetchHistory 回傳空陣列。
 */
class OpenWeatherMapAdapter extends BaseProxyAdapter {
  readonly source: WeatherSource = 'openweathermap';

  protected override get displayName(): string {
    return 'OpenWeatherMap';
  }

  async fetchHistory?(): Promise<HistoricalDayWeather[]> {
    return [];
  }
}

export default new OpenWeatherMapAdapter();
