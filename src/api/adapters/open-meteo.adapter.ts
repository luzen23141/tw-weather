import { HistoricalDayWeather, Location, WeatherSource } from '../types';

import { buildWeatherUrl, proxyFetch } from '@/api/proxy-fetch';
import { type ProxyWeatherResponse, toHistoricalWeather } from '@/api/proxy-weather-response';

import { BaseProxyAdapter } from './base-proxy.adapter';

/**
 * Open-Meteo API Adapter
 *
 * 透過 proxy_golang /api/weather/* 取得資料（後端 provider ID: "openmeteo"）：
 * - /api/weather/current  → 即時天氣
 * - /api/weather/hourly   → 逐時預報
 * - /api/weather/daily    → 每日預報
 * - /api/weather/history  → 歷史天氣（指定日期範圍）
 *
 * Open-Meteo 無需 API Key，由後端直接轉發。
 */
class OpenMeteoAdapter extends BaseProxyAdapter {
  readonly source: WeatherSource = 'open-meteo';

  /** 後端 provider ID（不同於前端 source） */
  protected override get providerID(): string {
    return 'openmeteo';
  }

  protected override get displayName(): string {
    return 'Open-Meteo';
  }

  async fetchHistory(location: Location, days: number): Promise<HistoricalDayWeather[]> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days);

      const formatDate = (date: Date): string => date.toISOString().split('T')[0] ?? '';

      const params = {
        ...this.buildLocationParams(location),
        date: formatDate(startDate),
        days: String(days),
      };

      const response = await proxyFetch(buildWeatherUrl('history', params));
      if (!response.ok) {
        throw this.wrapError(
          new Error(`HTTP ${response.status}: ${response.statusText}`),
          '歷史資料 API 失敗',
        );
      }

      const resp = (await response.json()) as ProxyWeatherResponse;
      return toHistoricalWeather(resp.daily ?? [], this.source);
    } catch (error) {
      throw this.wrapError(error, '歷史資料取得失敗');
    }
  }
}

export default new OpenMeteoAdapter();
