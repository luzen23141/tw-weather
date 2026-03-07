type ProxyRequest = {
  method?: string;
  query: Record<string, string | string[] | undefined>;
};

type ProxyResponse = {
  setHeader: (name: string, value: string) => ProxyResponse;
  status: (code: number) => ProxyResponse;
  send: (body: string) => ProxyResponse;
  json: (body: unknown) => ProxyResponse;
  end: () => ProxyResponse;
};
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

type CacheEntry = {
  status: number;
  body: string;
  expireAt: number;
};

const PROXY_CACHE_TTL_MS = 5 * 60 * 1000;
const responseCache = new Map<string, CacheEntry>();

function buildCacheKey(service: string, endpoint: string, query: ProxyRequest['query']): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (key === 'service' || key === 'endpoint') continue;
    if (Array.isArray(value)) {
      [...value]
        .map((v) => String(v))
        .sort()
        .forEach((v) => params.append(key, v));
    } else if (value !== undefined) {
      params.append(key, String(value));
    }
  }

  return `${service}|${endpoint}|${params.toString()}`;
}

function readCache(key: string): CacheEntry | null {
  const cached = responseCache.get(key);
  if (!cached) {
    return null;
  }

  if (cached.expireAt <= Date.now()) {
    responseCache.delete(key);
    return null;
  }

  return cached;
}

function writeCache(key: string, status: number, body: string): void {
  responseCache.set(key, {
    status,
    body,
    expireAt: Date.now() + PROXY_CACHE_TTL_MS,
  });
}

export default async function handler(req: ProxyRequest, res: ProxyResponse): Promise<void> {
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

    const cacheKey = buildCacheKey(service, endpoint, req.query);
    const cached = readCache(cacheKey);
    if (cached) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('X-Cache', 'HIT');
      res.status(cached.status).send(cached.body);
      return;
    }

    const url = new URL(`${route.base}/${endpoint}`);

    // 轉發其他 query params（排除 service、endpoint、key params）
    for (const [key, value] of Object.entries(req.query)) {
      if (key === 'service' || key === 'endpoint' || key === route.keyParam) continue;
      if (Array.isArray(value)) {
        value.forEach((v) => url.searchParams.append(key, v));
      } else if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }

    // 注入 API key
    url.searchParams.set(route.keyParam, apiKey);

    const upstream = await fetch(url.toString());
    const text = await upstream.text();

    if (upstream.ok) {
      writeCache(cacheKey, upstream.status, text);
    }

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('X-Cache', 'MISS');
    res.status(upstream.status).send(text);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
}
