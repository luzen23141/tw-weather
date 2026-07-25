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

/**
 * UI 可查詢的歷史天數上限。
 *
 * 這是「使用者最遠能往回看多久」，**不是**任一資料源的能力上限 —— 各來源的上限
 * 由 `fetchHistory` 內部依來源分別套用（Open-Meteo 92、WeatherAPI 7），來源降級時
 * 自然拿到較短的區間。
 *
 * 先前這個值是 7，等於在送進 service 之前就先砍到最弱來源的水準，讓分來源的
 * 上限邏輯完全失效 —— Open-Meteo 的 92 天永遠用不到。
 */
export const MAX_HISTORY_RANGE_DAYS = 92;

/** Open-Meteo archive 的實際上限 */
export const OPEN_METEO_MAX_HISTORY_DAYS = 92;
/** WeatherAPI 免費方案的實際上限 */
export const WEATHERAPI_MAX_HISTORY_DAYS = 7;

/**
 * WeatherService - 統一天氣資料取得服務
 *
 * 根據 AppSettings 決定資料取得策略：
 * - single 模式：直接呼叫指定的單一 Adapter
 * - aggregate 模式：並行呼叫所有啟用的 Adapter，依規則聚合結果
 */
class WeatherService {
  private adapters: Map<WeatherSource, WeatherApiAdapter>;
  private readonly failureTracker = new Map<
    WeatherSource,
    { count: number; lastFailTime: number }
  >();
  private readonly CIRCUIT_THRESHOLD = 3;
  private readonly CIRCUIT_RESET_MS = 5 * 60 * 1000;

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

  private isCircuitOpen(source: WeatherSource): boolean {
    const tracker = this.failureTracker.get(source);
    if (!tracker) return false;
    if (tracker.count < this.CIRCUIT_THRESHOLD) return false;
    if (Date.now() - tracker.lastFailTime > this.CIRCUIT_RESET_MS) {
      this.failureTracker.delete(source);
      return false;
    }
    return true;
  }

  private recordFailure(source: WeatherSource): void {
    const existing = this.failureTracker.get(source) ?? { count: 0, lastFailTime: 0 };
    this.failureTracker.set(source, {
      count: existing.count + 1,
      lastFailTime: Date.now(),
    });
  }

  private recordSuccess(source: WeatherSource): void {
    this.failureTracker.delete(source);
  }

  private async fetchWeatherFromAdapter(
    location: Location,
    source: WeatherSource,
    includeHistory = false,
  ): Promise<WeatherData> {
    const adapter = this.getAdapter(source);
    const weatherData = await adapter.fetchWeather(location);

    let history: HistoricalDayWeather[] = [];
    if (includeHistory && adapter.fetchHistory) {
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
    const activeSources = sources.filter((s) => !this.isCircuitOpen(s));
    const skippedSources = sources.filter((s) => this.isCircuitOpen(s));

    if (skippedSources.length > 0) {
      console.warn(`熔斷中，跳過以下資料源: ${skippedSources.join(', ')}`);
    }

    const fallbackSource = sources[0];
    const sourcesToFetch =
      activeSources.length > 0
        ? activeSources
        : fallbackSource !== undefined
          ? [fallbackSource]
          : sources;

    const results = await Promise.allSettled(
      sourcesToFetch.map((source) => this.fetchWeatherFromAdapter(location, source)),
    );

    /*
      先把來源與結果配對，再分流。

      先前的寫法是 `results.filter(...).map((r, index) => sourcesToFetch[index])` ——
      但 `filter` 之後的 index 是**過濾後**陣列的索引，不再對應 sourcesToFetch。
      實際後果：CWA 失敗、Open-Meteo 成功時，成功會被記到 CWA 頭上，把它剛累積的
      失敗計數清掉。壞掉的來源因此永遠達不到熔斷門檻，熔斷器形同虛設 —— 而它存在
      的意義正是別再一直打一個已知壞掉的上游。
    */
    const successResults: WeatherData[] = [];
    const failedResults: unknown[] = [];

    results.forEach((result, index) => {
      const source = sourcesToFetch[index];
      if (result.status === 'fulfilled') {
        if (source) this.recordSuccess(source);
        successResults.push(result.value);
      } else {
        if (source) this.recordFailure(source);
        failedResults.push(result.reason);
      }
    });

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
    // 優先使用 Open-Meteo（最多支援 92 天歷史）
    const openMeteo = this.adapters.get('open-meteo');
    if (openMeteo?.fetchHistory) {
      const normalizedDays = Math.min(days, OPEN_METEO_MAX_HISTORY_DAYS);
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
      const normalizedDays = Math.min(days, WEATHERAPI_MAX_HISTORY_DAYS);
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
}

// 導出單例
export const weatherService = new WeatherService();

// 導出類別供測試
export { WeatherService };
