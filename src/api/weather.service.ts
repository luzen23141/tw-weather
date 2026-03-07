import { AggregationEngine } from '../aggregator/AggregationEngine';

import cwaAdapter from './adapters/cwa.adapter';
import openMeteoAdapter from './adapters/open-meteo.adapter';
import openWeatherMapAdapter from './adapters/openweathermap.adapter';
import weatherApiAdapter from './adapters/weatherapi.adapter';
import {
  AggregationConfig,
  HistoricalDayWeather,
  Location,
  WeatherApiAdapter,
  WeatherApiError,
  WeatherData,
  WeatherSource,
} from './types';

export const MAX_HISTORY_FETCH_DAYS = 7;

/**
 * WeatherService - 統一天氣資料取得服務
 *
 * 根據 AppSettings 決定資料取得策略：
 * - single 模式：直接呼叫指定的單一 Adapter
 * - aggregate 模式：並行呼叫所有啟用的 Adapter，依規則聚合結果
 */
class WeatherService {
  private adapters: Map<WeatherSource, WeatherApiAdapter>;

  constructor() {
    this.adapters = new Map<WeatherSource, WeatherApiAdapter>([
      ['cwa', cwaAdapter],
      ['open-meteo', openMeteoAdapter],
      ['weatherapi', weatherApiAdapter],
      ['openweathermap', openWeatherMapAdapter],
    ]);
  }

  private getAdapter(source: WeatherSource): WeatherApiAdapter {
    const adapter = this.adapters.get(source);
    if (!adapter) {
      throw new WeatherApiError(
        `不支援的資料源: ${source}`,
        source,
        undefined,
        new Error(`Unknown weather source: ${source}`),
      );
    }

    return adapter;
  }

  private async fetchWeatherFromAdapter(
    location: Location,
    source: WeatherSource,
  ): Promise<WeatherData> {
    const adapter = this.getAdapter(source);
    const weatherData = await adapter.fetchWeather(location);

    let history: HistoricalDayWeather[] = [];
    if (adapter.fetchHistory) {
      try {
        history = await adapter.fetchHistory(location, 7);
      } catch (error) {
        console.warn(
          `${source} 歷史資料查詢失敗，回退為空陣列: ${error instanceof Error ? error.message : '未知錯誤'}`,
        );
      }
    }

    return { ...weatherData, history };
  }

  /**
   * 單一來源模式：直接呼叫指定的 Adapter
   */
  async fetchWeather(location: Location, source: WeatherSource): Promise<WeatherData> {
    try {
      return await this.fetchWeatherFromAdapter(location, source);
    } catch (error) {
      if (error instanceof WeatherApiError) {
        throw error;
      }
      throw new WeatherApiError(
        `無法取得 ${source} 資料: ${error instanceof Error ? error.message : '未知錯誤'}`,
        source,
        undefined,
        error instanceof Error ? error : undefined,
      );
    }
  }

  /**
   * 聚合模式：並行呼叫所有啟用的 Adapter，並依據聚合規則合併結果
   *
   * 失敗的 adapter 不拋出錯誤，而是記錄並以剩餘來源進行聚合
   * 若全部失敗則拋出錯誤
   */
  async fetchAggregated(
    location: Location,
    sources: WeatherSource[],
    config: AggregationConfig,
  ): Promise<WeatherData> {
    const results = await Promise.allSettled(
      sources.map((source) => this.fetchWeatherFromAdapter(location, source)),
    );

    const successResults = results
      .filter(
        (result): result is PromiseFulfilledResult<WeatherData> => result.status === 'fulfilled',
      )
      .map((result) => result.value);

    const failedResults = results
      .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
      .map((result) => result.reason);

    if (successResults.length === 0) {
      throw new WeatherApiError(
        `所有資料源查詢失敗: ${failedResults.map((e) => (e instanceof Error ? e.message : String(e))).join('; ')}`,
        'cwa',
        undefined,
        failedResults[0] instanceof Error ? failedResults[0] : new Error('All sources failed'),
      );
    }

    if (successResults.length === 1) {
      const result = successResults[0];
      if (result !== undefined) {
        return result;
      }
    }

    return new AggregationEngine().aggregate(successResults, config);
  }

  /**
   * 取得歷史天氣資料
   *
   * 優先級：
   * 1. 查詢本地快取（此方法不實作，由上層快取層處理）
   * 2. Open-Meteo 作為優先來源（支援無限歷史查詢）
   * 3. WeatherAPI 作為備選（限 7 天）
   */
  async fetchHistory(location: Location, days: number): Promise<HistoricalDayWeather[]> {
    const normalizedDays = Math.min(days, MAX_HISTORY_FETCH_DAYS);

    // 優先使用 Open-Meteo（最多支援 92 天歷史）
    const openMeteo = this.adapters.get('open-meteo');
    if (openMeteo?.fetchHistory) {
      try {
        return await openMeteo.fetchHistory(location, normalizedDays);
      } catch (error) {
        console.warn(
          `Open-Meteo 歷史資料查詢失敗: ${error instanceof Error ? error.message : '未知錯誤'}`,
        );
      }
    }

    // Fallback 到 WeatherAPI（限 7 天）
    const weatherApi = this.adapters.get('weatherapi');
    if (weatherApi?.fetchHistory) {
      try {
        return await weatherApi.fetchHistory(location, normalizedDays);
      } catch (error) {
        console.warn(
          `WeatherAPI 歷史資料查詢失敗: ${error instanceof Error ? error.message : '未知錯誤'}`,
        );
      }
    }

    throw new WeatherApiError(
      '無可用的歷史天氣資料來源',
      'open-meteo',
      undefined,
      new Error('No history sources available'),
    );
  }

  /**
   * 健康檢查：確認各資料源是否可用
   */
  async healthCheck(sources: WeatherSource[]): Promise<Record<WeatherSource, boolean>> {
    const results = await Promise.allSettled(
      sources.map(async (source) => {
        try {
          const ok = await this.getAdapter(source).healthCheck();
          return { source, ok };
        } catch {
          return { source, ok: false };
        }
      }),
    );

    const healthStatus: Record<WeatherSource, boolean> = {
      cwa: false,
      'open-meteo': false,
      weatherapi: false,
      openweathermap: false,
      aggregate: false,
    };

    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        healthStatus[result.value.source] = result.value.ok;
      }
    });

    return healthStatus;
  }
}

// 導出單例
export const weatherService = new WeatherService();

// 導出類別供測試
export { WeatherService };
