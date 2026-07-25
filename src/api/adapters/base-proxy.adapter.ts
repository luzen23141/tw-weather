import {
  CurrentWeather,
  DailyForecast,
  HourlyForecast,
  Location,
  WeatherApiAdapter,
  WeatherApiError,
  WeatherData,
  WeatherSource,
} from '../types';

import { buildWeatherUrl, proxyFetch, type WeatherEndpoint } from '@/api/proxy-fetch';
import {
  type ProxyWeatherResponse,
  toCurrentWeather,
  toDailyForecast,
  toHourlyForecast,
  toLocation,
} from '@/api/proxy-weather-response';

/**
 * Proxy-based Weather Adapter 基底類別
 *
 * 封裝了透過 proxy_golang /api/weather/* 取得資料的共用邏輯：
 * - 建構 location params（provider + lat + lon）
 * - fetchEndpoint（呼叫 proxy + 錯誤處理）
 * - fetchWeather（Promise.all 三端點 + 解析 + 組裝 WeatherData）
 * - 標準化錯誤處理 boilerplate
 *
 * 子類只需覆寫 `source`、`providerID`，以及可選的 parse / fetchHistory 方法。
 */
export abstract class BaseProxyAdapter implements WeatherApiAdapter {
  abstract readonly source: WeatherSource;

  /** 後端 provider ID（對應 proxy 的 `provider` query param）。預設與 source 相同。 */
  protected get providerID(): string {
    return this.source;
  }

  /** 顯示名稱，用於錯誤訊息。預設為 source。 */
  protected get displayName(): string {
    return this.source.toUpperCase();
  }

  async fetchWeather(location: Location): Promise<Omit<WeatherData, 'history'>> {
    try {
      const params = this.buildLocationParams(location);

      const [currentResp, hourlyResp, dailyResp] = await Promise.all([
        this.fetchEndpoint('current', this.buildEndpointParams('current', location, params)),
        this.fetchEndpoint('hourly', this.buildEndpointParams('hourly', location, params)),
        this.fetchEndpoint('daily', this.buildEndpointParams('daily', location, params)),
      ]);

      return {
        location: toLocation(currentResp.location),
        source: this.source,
        fetchedAt: new Date().toISOString(),
        current: this.parseCurrentWeather(currentResp),
        hourlyForecast: this.parseHourlyForecast(hourlyResp),
        dailyForecast: this.parseDailyForecast(dailyResp),
      };
    } catch (error) {
      if (error instanceof WeatherApiError) throw error;
      throw new WeatherApiError(
        `${this.displayName} 預報取得失敗: ${error instanceof Error ? error.message : '未知錯誤'}`,
        this.source,
        undefined,
        error instanceof Error ? error : undefined,
      );
    }
  }

  // ----- 可覆寫的 parse 方法 -----

  protected parseCurrentWeather(resp: ProxyWeatherResponse): CurrentWeather {
    if (!resp.current) {
      throw new WeatherApiError(`${this.displayName} current 回應缺少資料`, this.source);
    }
    return toCurrentWeather(resp.current, resp.updatedAt);
  }

  protected parseHourlyForecast(resp: ProxyWeatherResponse): HourlyForecast[] {
    return toHourlyForecast(resp.hourly ?? []);
  }

  protected parseDailyForecast(resp: ProxyWeatherResponse): DailyForecast[] {
    return toDailyForecast(resp.daily ?? []);
  }

  // ----- 共用 helper -----

  /**
   * 依端點微調查詢參數。預設原樣回傳。
   *
   * 存在的理由：部分來源的不同端點需要不同的定位方式 —— CWA 的即時觀測可由
   * lat/lon 找測站，但逐時／每日預報是依縣市切成不同 dataset，必須帶 locationId。
   */
  protected buildEndpointParams(
    _endpoint: WeatherEndpoint,
    _location: Location,
    params: Record<string, string>,
  ): Record<string, string> {
    return params;
  }

  protected buildLocationParams(location: Location): Record<string, string> {
    return {
      provider: this.providerID,
      lat: String(location.latitude),
      lon: String(location.longitude),
    };
  }

  protected async fetchEndpoint(
    endpoint: WeatherEndpoint,
    params: Record<string, string>,
  ): Promise<ProxyWeatherResponse> {
    const url = buildWeatherUrl(endpoint, params);
    const response = await proxyFetch(url);
    if (!response.ok) {
      throw new WeatherApiError(
        `${this.displayName} ${endpoint} API 失敗: ${response.statusText}`,
        this.source,
        response.status,
      );
    }
    return response.json() as Promise<ProxyWeatherResponse>;
  }

  /**
   * 將錯誤包裝為 WeatherApiError（若尚未是）。
   * 子類在 fetchHistory 等方法中使用。
   */
  protected wrapError(error: unknown, context: string): WeatherApiError {
    if (error instanceof WeatherApiError) return error;
    return new WeatherApiError(
      `${this.displayName} ${context}: ${error instanceof Error ? error.message : '未知錯誤'}`,
      this.source,
      undefined,
      error instanceof Error ? error : undefined,
    );
  }
}
