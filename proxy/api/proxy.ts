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

type RouteConfig = {
  base: string;
  keyParam: string;
  envKey: string;
  allowedEndpoints: ReadonlySet<string>;
};

const ROUTES: Record<string, RouteConfig> = {
  cwa: {
    base: 'https://opendata.cwa.gov.tw/api/v1/rest/datastore',
    keyParam: 'Authorization',
    envKey: 'CWA_API_KEY',
    allowedEndpoints: new Set(['O-A0001-001', 'F-D0047-089', 'F-D0047-091']),
  },
  weatherapi: {
    base: 'https://api.weatherapi.com/v1',
    keyParam: 'key',
    envKey: 'WEATHERAPI_KEY',
    allowedEndpoints: new Set(['current.json', 'forecast.json', 'history.json']),
  },
  openweathermap: {
    base: 'https://api.openweathermap.org',
    keyParam: 'appid',
    envKey: 'OPENWEATHERMAP_KEY',
    allowedEndpoints: new Set(['data/2.5/weather', 'data/2.5/forecast']),
  },
};

type CacheEntry = {
  status: number;
  body: string;
  expireAt: number;
};

const PROXY_CACHE_TTL_MS = 5 * 60 * 1000;
const PROXY_TIMEOUT_MS = 8000;
const MAX_QUERY_KEYS = 20;
const MAX_QUERY_VALUE_LENGTH = 200;
const MAX_QUERY_TOTAL_LENGTH = 2000;
const MAX_URL_LENGTH = 2048;

const responseCache = new Map<string, CacheEntry>();

const ENDPOINT_PATTERN = /^[a-zA-Z0-9._/-]+$/;

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

function normalizeQueryValue(value: string | string[] | undefined): string[] {
  if (value === undefined) return [];
  if (Array.isArray(value)) return value.map((v) => String(v));
  return [String(value)];
}

function isValidEndpoint(endpoint: string): boolean {
  if (!endpoint) return false;
  if (!ENDPOINT_PATTERN.test(endpoint)) return false;
  if (endpoint.includes('..')) return false;
  if (
    endpoint.startsWith('/') ||
    endpoint.startsWith('http://') ||
    endpoint.startsWith('https://')
  ) {
    return false;
  }
  return true;
}

function validateAndAppendQuery(
  url: URL,
  query: ProxyRequest['query'],
  keyParam: string,
): { ok: true } | { ok: false; status: number; error: string } {
  const entries = Object.entries(query).filter(
    ([key]) => key !== 'service' && key !== 'endpoint' && key !== keyParam,
  );

  if (entries.length > MAX_QUERY_KEYS) {
    return { ok: false, status: 400, error: 'Too many query keys' };
  }

  let totalLength = 0;

  for (const [key, rawValue] of entries) {
    if (!key || key.length > 64) {
      return { ok: false, status: 400, error: 'Invalid query key' };
    }

    const values = normalizeQueryValue(rawValue);
    for (const value of values) {
      if (value.length > MAX_QUERY_VALUE_LENGTH) {
        return { ok: false, status: 400, error: 'Query value too long' };
      }
      totalLength += key.length + value.length;
      if (totalLength > MAX_QUERY_TOTAL_LENGTH) {
        return { ok: false, status: 400, error: 'Query too large' };
      }
      url.searchParams.append(key, value);
    }
  }

  if (url.toString().length > MAX_URL_LENGTH) {
    return { ok: false, status: 400, error: 'Request URL too long' };
  }

  return { ok: true };
}

export default async function handler(req: ProxyRequest, res: ProxyResponse): Promise<void> {
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, OPTIONS');
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  try {
    const service = typeof req.query['service'] === 'string' ? req.query['service'] : '';
    const endpoint = typeof req.query['endpoint'] === 'string' ? req.query['endpoint'].trim() : '';

    const route = ROUTES[service];
    if (!route) {
      res.status(400).json({ error: 'Invalid service' });
      return;
    }

    if (!isValidEndpoint(endpoint) || !route.allowedEndpoints.has(endpoint)) {
      res.status(400).json({ error: 'Invalid endpoint' });
      return;
    }

    const apiKey = process.env[route.envKey];
    if (!apiKey) {
      res.status(500).json({ error: 'Service not configured' });
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
    const validation = validateAndAppendQuery(url, req.query, route.keyParam);
    if (!validation.ok) {
      res.status(validation.status).json({ error: validation.error });
      return;
    }

    url.searchParams.set(route.keyParam, apiKey);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), PROXY_TIMEOUT_MS);

    let upstream: Response;
    let text: string;

    try {
      upstream = await fetch(url.toString(), {
        method: 'GET',
        signal: controller.signal,
      });
      text = await upstream.text();
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        res.status(504).json({ error: 'Upstream timeout' });
        return;
      }
      res.status(502).json({ error: 'Upstream request failed' });
      return;
    } finally {
      clearTimeout(timeout);
    }

    if (upstream.ok) {
      writeCache(cacheKey, upstream.status, text);
    }

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('X-Cache', 'MISS');
    res.status(upstream.status).send(text);
  } catch {
    res.status(500).json({ error: 'Internal proxy error' });
  }
}
