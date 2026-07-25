import { HistoricalDayWeather, Location, WeatherSource } from '../types';

import { BaseProxyAdapter } from './base-proxy.adapter';

import { getCwaForecastLocationId } from '@/api/cwa-datasets';
import type { WeatherEndpoint } from '@/api/proxy-fetch';

/**
 * CWA (中央氣象署) API Adapter
 *
 * 透過 proxy_golang /api/weather/* 取得資料：
 * - /api/weather/current  → 即時天氣（依 lat/lon 找測站）
 * - /api/weather/hourly   → 逐時預報（**需 locationId**）
 * - /api/weather/daily    → 每日預報（**需 locationId**）
 *
 * CWA 不支援歷史資料，fetchHistory 回傳空陣列。
 */
class CwaAdapter extends BaseProxyAdapter {
  readonly source: WeatherSource = 'cwa';

  protected override get displayName(): string {
    return 'CWA';
  }

  /**
   * 預報端點補上 locationId。
   *
   * CWA 的逐時／每日預報依縣市切成不同 dataset，proxy 需要 locationId 才知道
   * 要打哪一支上游 API。先前前端從未送出它 —— 這兩個端點因此一律回 400，
   * 導致聚合模式下 CWA 完全無法參與預報，「多資料源」實際上只剩一個來源。
   *
   * 縣市無法對應時（例如境外座標）不送 locationId，讓請求以明確的錯誤失敗，
   * 而非帶著一個猜測的 dataset 回傳別的縣市的天氣。
   */
  protected override buildEndpointParams(
    endpoint: WeatherEndpoint,
    location: Location,
    params: Record<string, string>,
  ): Record<string, string> {
    if (endpoint !== 'hourly' && endpoint !== 'daily') return params;

    const locationId = getCwaForecastLocationId(location.city, endpoint);
    if (locationId === undefined) return params;

    const next: Record<string, string> = { ...params, locationId };

    // locationId 只決定「打哪一支縣市 dataset」，該 dataset 內是整個縣市的所有
    // 鄉鎮，還要 township 才能定位到正確的一個。少了它 CWA 會回 0 筆而非錯誤 ——
    // 靜默的空結果比明確的失敗更難察覺。
    const township = location.township ?? location.district;
    if (township !== undefined && township !== '') {
      next['township'] = township;
    }

    return next;
  }

  async fetchHistory?(): Promise<HistoricalDayWeather[]> {
    return [];
  }
}

export default new CwaAdapter();
