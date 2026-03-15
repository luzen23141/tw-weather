const PROXY_URL = process.env.EXPO_PUBLIC_PROXY_URL;
// ⚠️ 安全警告：EXPO_PUBLIC_ 前綴的變數會被 inline 進 client bundle，
// 任何人都能從 bundle 中提取此 secret，HMAC 驗證因此形同虛設。
// 正確做法：移除 client 端簽章，改由 proxy server 端以 CORS origin 或
// server-side API key 驗證請求來源。
const PROXY_SECRET = process.env.EXPO_PUBLIC_PROXY_SECRET;

export type WeatherEndpoint = 'current' | 'hourly' | 'daily' | 'history';

export function buildWeatherUrl(endpoint: WeatherEndpoint, params: Record<string, string>): string {
  if (!PROXY_URL) {
    throw new Error('EXPO_PUBLIC_PROXY_URL not found');
  }

  const url = new URL(`${PROXY_URL}/api/weather/${endpoint}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return url.toString();
}

async function signRequest(timestamp: string, path: string): Promise<Record<string, string>> {
  if (!PROXY_SECRET) return {};

  const [pathname, search] = path.split('?');
  const searchParams = new URLSearchParams(search ?? '');
  const sortedEntries = Array.from(searchParams.entries()).sort(([a], [b]) => a.localeCompare(b));
  const sortedSearch = new URLSearchParams(sortedEntries).toString();
  const message = `${timestamp}\nGET\n${pathname}${sortedSearch ? `?${sortedSearch}` : ''}`;
  const encoder = new TextEncoder();

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(PROXY_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  const hexSig = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return {
    'X-Timestamp': timestamp,
    'X-Signature': hexSig,
  };
}

export async function proxyFetch(url: string): Promise<Response> {
  const urlObj = new URL(url);
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const authHeaders = await signRequest(timestamp, `${urlObj.pathname}${urlObj.search}`);
  return fetch(url, { headers: authHeaders });
}
