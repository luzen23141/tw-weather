/**
 * 資料源清單（/api/provider/list）。
 *
 * 設定頁的來源列表由後端提供，而非前端寫死 —— 有哪些來源、叫什麼名字、
 * 能不能用，這些是**伺服器的事實**：金鑰配置在伺服器端，新增來源也是
 * 後端先有。前端寫死一份等於維護第二份會漂移的真相。
 */

import { buildApiUrl, proxyFetch } from '@/api/proxy-fetch';
import { toWeatherSource } from '@/api/proxy-weather-response';
import { WeatherSource } from '@/api/types';

/** 後端回傳的原始項目 */
interface RawProvider {
  id: string;
  name: string;
  description: string;
  status: 'available' | 'unconfigured';
}

export interface Provider {
  /** 前端使用的來源代號（後端的 openmeteo 已映射為 open-meteo） */
  id: WeatherSource;
  /** 顯示名稱 */
  name: string;
  /** 來源說明 */
  description: string;
  /**
   * 可用狀態。unconfigured = 需要金鑰但伺服器未配置 ——
   * UI 應停用該來源的開關，而不是讓使用者選了之後才收到錯誤。
   */
  status: 'available' | 'unconfigured';
}

export async function fetchProviders(): Promise<Provider[]> {
  const response = await proxyFetch(buildApiUrl('/api/provider/list'));
  if (!response.ok) {
    throw new Error(`Provider list 取得失敗: HTTP ${response.status}`);
  }

  const raw = (await response.json()) as RawProvider[];
  return raw.map((p) => ({
    id: toWeatherSource(p.id),
    name: p.name,
    description: p.description,
    status: p.status,
  }));
}
