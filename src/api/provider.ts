import { proxyFetch } from './proxy-fetch';

/** 後端回傳的資料源資訊 */
export interface ProviderInfo {
  /** provider 代碼（呼叫 API 用） */
  id: string;
  /** 顯示名稱（前端顯示用） */
  name: string;
  /** 說明描述 */
  description: string;
}

const PROXY_URL = process.env.EXPO_PUBLIC_PROXY_URL;

/** 從後端取得可用 provider 清單 */
export async function fetchProviders(): Promise<ProviderInfo[]> {
  if (!PROXY_URL) {
    throw new Error('EXPO_PUBLIC_PROXY_URL not found');
  }

  const url = `${PROXY_URL}/api/provider/list`;
  const response = await proxyFetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch providers: ${response.statusText}`);
  }

  return response.json() as Promise<ProviderInfo[]>;
}
