import {
  CurrentWeather,
  DailyForecast,
  HistoricalDayWeather,
  HourlyForecast,
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
  toHourlyForecast,
  toLocation,
} from '@/api/proxy-weather-response';

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
class CwaAdapter implements WeatherApiAdapter {
  readonly source: WeatherSource = 'cwa';

  async fetchWeather(location: Location): Promise<Omit<WeatherData, 'history'>> {
    try {
      const params = this.buildLocationParams(location);

      const [currentResp, hourlyResp, dailyResp] = await Promise.all([
        this.fetchEndpoint('current', params),
        this.fetchEndpoint('hourly', params),
        this.fetchEndpoint('daily', params),
      ]);

      const current = this.parseCurrentWeather(currentResp);
      const hourlyForecast = this.parseHourlyForecast(hourlyResp);
      const dailyForecast = this.parseDailyForecast(dailyResp);

      return {
        location: toLocation(currentResp.location),
        source: this.source,
        fetchedAt: new Date().toISOString(),
        current,
        hourlyForecast,
        dailyForecast,
      };
    } catch (error) {
      if (error instanceof WeatherApiError) throw error;
      throw new WeatherApiError(
        `CWA 預報取得失敗: ${error instanceof Error ? error.message : '未知錯誤'}`,
        this.source,
        undefined,
        error instanceof Error ? error : undefined,
      );
    }
  }

  async fetchHistory?(): Promise<HistoricalDayWeather[]> {
    return [];
  }

  private buildLocationParams(location: Location): Record<string, string> {
    return {
      provider: 'cwa',
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
        `CWA ${endpoint} API 失敗: ${response.statusText}`,
        this.source,
        response.status,
      );
    }
    return response.json() as Promise<ProxyWeatherResponse>;
  }

  private parseCurrentWeather(resp: ProxyWeatherResponse): CurrentWeather {
    if (!resp.current) {
      throw new WeatherApiError('CWA current 回應缺少資料', this.source);
    }
    return toCurrentWeather(resp.current, resp.updatedAt);
  }

  private parseHourlyForecast(resp: ProxyWeatherResponse): HourlyForecast[] {
    return toHourlyForecast(resp.hourly ?? []);
  }

  private parseDailyForecast(resp: ProxyWeatherResponse): DailyForecast[] {
    return toDailyForecast(resp.daily ?? []);
  }
}

export default new CwaAdapter();
