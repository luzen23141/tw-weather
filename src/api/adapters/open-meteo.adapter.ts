import {
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
 * Open-Meteo API Adapter
 *
 * 透過 proxy_golang /api/weather/* 取得資料（後端 provider ID: "openmeteo"）：
 * - /api/weather/current  → 即時天氣
 * - /api/weather/hourly   → 逐時預報
 * - /api/weather/daily    → 每日預報
 * - /api/weather/history  → 歷史天氣（指定日期）
 *
 * Open-Meteo 無需 API Key，由後端直接轉發。
 */
class OpenMeteoAdapter implements WeatherApiAdapter {
  readonly source: WeatherSource = 'open-meteo';

  /** 後端 provider ID（不同於前端 source） */
  private readonly providerID = 'openmeteo';

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
        current: toCurrentWeather(
          currentResp.current ??
            (() => {
              throw new WeatherApiError('Open-Meteo current 回應缺少資料', this.source);
            })(),
          currentResp.updatedAt,
        ),
        hourlyForecast: toHourlyForecast(hourlyResp.hourly ?? []),
        dailyForecast: toDailyForecast(dailyResp.daily ?? []),
      };
    } catch (error) {
      if (error instanceof WeatherApiError) throw error;
      throw new WeatherApiError(
        `Open-Meteo 預報取得失敗: ${error instanceof Error ? error.message : '未知錯誤'}`,
        this.source,
        undefined,
        error instanceof Error ? error : undefined,
      );
    }
  }

  async fetchHistory(location: Location, days: number): Promise<HistoricalDayWeather[]> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days);

      const formatDate = (date: Date): string => date.toISOString().split('T')[0] ?? '';

      // Open-Meteo 歷史 API 以 start_date ~ end_date 一次取得
      // 後端以第一天作為 date 參數；前端傳 startDate
      const params = {
        ...this.buildLocationParams(location),
        date: formatDate(startDate),
        days: String(days),
      };

      const response = await proxyFetch(buildWeatherUrl('history', params));
      if (!response.ok) {
        throw new WeatherApiError(
          `Open-Meteo 歷史資料 API 失敗: ${response.statusText}`,
          this.source,
          response.status,
        );
      }

      const resp = (await response.json()) as ProxyWeatherResponse;
      return toHistoricalWeather(resp.daily ?? [], this.source);
    } catch (error) {
      if (error instanceof WeatherApiError) throw error;
      throw new WeatherApiError(
        `Open-Meteo 歷史資料取得失敗: ${error instanceof Error ? error.message : '未知錯誤'}`,
        this.source,
        undefined,
        error instanceof Error ? error : undefined,
      );
    }
  }

  private buildLocationParams(location: Location): Record<string, string> {
    return {
      provider: this.providerID,
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
        `Open-Meteo ${endpoint} API 失敗: ${response.statusText}`,
        this.source,
        response.status,
      );
    }
    return response.json() as Promise<ProxyWeatherResponse>;
  }
}

export default new OpenMeteoAdapter();
