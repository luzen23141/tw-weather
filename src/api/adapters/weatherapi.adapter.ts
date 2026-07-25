import { HistoricalDayWeather, Location, WeatherSource } from '../types';

import { buildWeatherUrl, proxyFetch } from '@/api/proxy-fetch';
import { type ProxyWeatherResponse, toHistoricalWeather } from '@/api/proxy-weather-response';
import { toLocalDateString } from '@/utils/date';

import { BaseProxyAdapter } from './base-proxy.adapter';

/**
 * WeatherAPI.com Adapter
 *
 * 透過 proxy_golang /api/weather/* 取得資料：
 * - /api/weather/current  → 即時天氣
 * - /api/weather/hourly   → 逐時預報
 * - /api/weather/daily    → 每日預報
 * - /api/weather/history  → 歷史天氣（逐日，最多 7 天）
 */
class WeatherApiComAdapter extends BaseProxyAdapter {
  readonly source: WeatherSource = 'weatherapi';

  protected override get displayName(): string {
    return 'WeatherAPI';
  }

  async fetchHistory(location: Location, days: number): Promise<HistoricalDayWeather[]> {
    try {
      const history: HistoricalDayWeather[] = [];
      const now = new Date();
      const queryDays = Math.min(days, 7); // 免費方案限 7 天

      for (let i = 1; i <= queryDays; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = toLocalDateString(date);

        const params = {
          ...this.buildLocationParams(location),
          date: dateStr,
        };

        const response = await proxyFetch(buildWeatherUrl('history', params));
        if (!response.ok) {
          console.warn(`WeatherAPI 歷史資料 ${dateStr} 查詢失敗`);
          continue;
        }

        const resp = (await response.json()) as ProxyWeatherResponse;
        history.push(...toHistoricalWeather(resp.daily ?? [], this.source));
      }

      return history.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } catch (error) {
      throw this.wrapError(error, '歷史資料取得失敗');
    }
  }
}

export default new WeatherApiComAdapter();
