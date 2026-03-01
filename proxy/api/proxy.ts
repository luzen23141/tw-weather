import type { VercelRequest, VercelResponse } from '@vercel/node';

const ROUTES: Record<string, { base: string; keyParam: string; envKey: string }> = {
  cwa: {
    base: 'https://opendata.cwa.gov.tw/api/v1/rest/datastore',
    keyParam: 'Authorization',
    envKey: 'CWA_API_KEY',
  },
  weatherapi: {
    base: 'https://api.weatherapi.com/v1',
    keyParam: 'key',
    envKey: 'WEATHERAPI_KEY',
  },
  openweathermap: {
    base: 'https://api.openweathermap.org',
    keyParam: 'appid',
    envKey: 'OPENWEATHERMAP_KEY',
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  try {
    // 從 ?service=cwa&endpoint=O-A0001-001 取得路由資訊
    const service = typeof req.query['service'] === 'string' ? req.query['service'] : '';
    const endpoint = typeof req.query['endpoint'] === 'string' ? req.query['endpoint'] : '';

    const route = ROUTES[service];
    if (!route) {
      res.status(400).json({ error: `Unknown service: ${service}` });
      return;
    }

    const apiKey = process.env[route.envKey];
    if (!apiKey) {
      res.status(500).json({ error: `${route.envKey} not configured` });
      return;
    }

    const url = new URL(`${route.base}/${endpoint}`);

    // 轉發其他 query params（排除 service、endpoint、key params）
    for (const [key, value] of Object.entries(req.query)) {
      if (key === 'service' || key === 'endpoint' || key === route.keyParam) continue;
      if (Array.isArray(value)) {
        value.forEach((v) => url.searchParams.append(key, v));
      } else if (value !== undefined) {
        url.searchParams.set(key, value);
      }
    }

    // 注入 API key
    url.searchParams.set(route.keyParam, apiKey);

    const upstream = await fetch(url.toString());
    const text = await upstream.text();

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.status(upstream.status).send(text);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
}
