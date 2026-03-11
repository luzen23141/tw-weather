import {
  CurrentWeather,
  HistoricalDayWeather,
  Location,
  WeatherApiAdapter,
  WeatherApiError,
  WeatherData,
  WeatherSource,
} from '../types';

import { buildWeatherUrl, proxyFetch } from '@/api/proxy-fetch';
import {
  ProxyWeatherResponse,
  toCurrentWeather,
  toDailyForecast,
  toHistoricalWeather,
  toHourlyForecast,
  toLocation,
} from '@/api/proxy-weather-response';

/**
 * WeatherAPI.com Adapter
 *
 * 透過 proxy_golang /api/weather/* 取得資料：
 * - /api/weather/current  → 即時天氣
 * - /api/weather/hourly   → 逐時預報
 * - /api/weather/daily    → 每日預報
 * - /api/weather/history  → 歷史天氣（逐日，最多 7 天）
 */
class WeatherApiComAdapter implements WeatherApiAdapter {
  readonly source: WeatherSource = 'weatherapi';

  async fetchWeather(location: Location): Promise<Omit<WeatherData, 'history'>> {
    try {
      const params = this.buildLocationParams(location);

      const [currentResp, hourlyResp, dailyResp] = await Promise.all([
        this.fetchEndpoint('current', params),
        this.fetchEndpoint('hourly', params),
        this.fetchEndpoint('daily', params),
      ]);

      return {
        location: toLocation(currentResp.location),
        source: this.source,
        fetchedAt: new Date().toISOString(),
        current: this.parseCurrentWeather(currentResp),
        hourlyForecast: toHourlyForecast(hourlyResp.hourly ?? []),
        dailyForecast: toDailyForecast(dailyResp.daily ?? []),
      };
    } catch (error) {
      if (error instanceof WeatherApiError) throw error;
      throw new WeatherApiError(
        `WeatherAPI 預報取得失敗: ${error instanceof Error ? error.message : '未知錯誤'}`,
        this.source,
        undefined,
        error instanceof Error ? error : undefined,
      );
    }
  }

  async fetchHistory(location: Location, days: number): Promise<HistoricalDayWeather[]> {
    try {
      const history: HistoricalDayWeather[] = [];
      const now = new Date();
      const queryDays = Math.min(days, 7); // 免費方案限 7 天

      for (let i = 1; i <= queryDays; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0] ?? '';

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
      if (error instanceof WeatherApiError) throw error;
      throw new WeatherApiError(
        `WeatherAPI 歷史資料取得失敗: ${error instanceof Error ? error.message : '未知錯誤'}`,
        this.source,
        undefined,
        error instanceof Error ? error : undefined,
      );
    }
  }

  private buildLocationParams(location: Location): Record<string, string> {
    return {
      provider: 'weatherapi',
      lat: String(location.latitude),
      lon: String(location.longitude),
    };
  }

  private async fetchEndpoint(
    endpoint: 'current' | 'hourly' | 'daily',
    params: Record<string, string>,
  ): Promise<ProxyWeatherResponse> {
    const url = buildWeatherUrl(endpoint, params);
    const response = await proxyFetch(url);
    if (!response.ok) {
      throw new WeatherApiError(
        `WeatherAPI ${endpoint} API 失敗: ${response.statusText}`,
        this.source,
        response.status,
      );
    }
    return response.json() as Promise<ProxyWeatherResponse>;
  }

  private parseCurrentWeather(resp: ProxyWeatherResponse): CurrentWeather {
    if (!resp.current) {
      throw new WeatherApiError('WeatherAPI current 回應缺少資料', this.source);
    }
    return toCurrentWeather(resp.current, resp.updatedAt);
  }
}

export default new WeatherApiComAdapter();
