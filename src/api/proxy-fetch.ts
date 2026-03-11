const PROXY_URL = process.env.EXPO_PUBLIC_PROXY_URL;
const PROXY_SECRET = process.env.EXPO_PUBLIC_PROXY_SECRET;

export function buildProxyUrl(
  service: string,
  endpoint: string,
  params: Record<string, string>,
): string {
  if (!PROXY_URL) {
    throw new Error('EXPO_PUBLIC_PROXY_URL not found');
  }

  const url = new URL(`${PROXY_URL}/api/proxy`);
  url.searchParams.set('service', service);
  url.searchParams.set('endpoint', endpoint);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return url.toString();
}

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

  const message = `${timestamp}\nGET\n${path}`;
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
  const authHeaders = await signRequest(timestamp, urlObj.pathname);
  return fetch(url, { headers: authHeaders });
}
