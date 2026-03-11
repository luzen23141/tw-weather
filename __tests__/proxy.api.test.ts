import handler from '../proxy/api/proxy';

type MockRes = {
  headers: Record<string, string>;
  statusCode: number;
  body: unknown;
  ended: boolean;
};

function createRes(): { raw: MockRes; res: unknown } {
  const raw: MockRes = {
    headers: {},
    statusCode: 200,
    body: undefined,
    ended: false,
  };

  const res = {
    setHeader: (key: string, value: string) => {
      raw.headers[key] = value;
      return res;
    },
    status: (code: number) => {
      raw.statusCode = code;
      return res;
    },
    send: (body: unknown) => {
      raw.body = body;
      return res;
    },
    json: (body: unknown) => {
      raw.body = body;
      return res;
    },
    end: () => {
      raw.ended = true;
      return res;
    },
  };

  return { raw, res };
}

describe('proxy/api/proxy', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.WEATHERAPI_KEY = 'test-weatherapi-key';
  });

  it('同參數第二次請求應命中快取 (MISS -> HIT)', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ ok: true }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const req = {
      method: 'GET',
      query: {
        service: 'weatherapi',
        endpoint: 'current.json',
        q: 'Taipei',
      },
    };

    const first = createRes();
    await handler(req as never, first.res as never);

    const second = createRes();
    await handler(req as never, second.res as never);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(first.raw.headers['X-Cache']).toBe('MISS');
    expect(second.raw.headers['X-Cache']).toBe('HIT');
    expect(second.raw.statusCode).toBe(200);
    expect(second.raw.body).toBe(JSON.stringify({ ok: true }));
  });

  it('錯誤回應不應被快取', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => JSON.stringify({ error: 'upstream error' }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const req = {
      method: 'GET',
      query: {
        service: 'weatherapi',
        endpoint: 'history.json',
        q: 'Taipei',
        dt: '2026-03-08',
      },
    };

    const first = createRes();
    await handler(req as never, first.res as never);

    const second = createRes();
    await handler(req as never, second.res as never);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(first.raw.headers['X-Cache']).toBe('MISS');
    expect(second.raw.headers['X-Cache']).toBe('MISS');
    expect(first.raw.statusCode).toBe(500);
    expect(second.raw.statusCode).toBe(500);
  });

  it('應拒絕非 GET 方法', async () => {
    const req = {
      method: 'POST',
      query: {
        service: 'weatherapi',
        endpoint: 'current.json',
      },
    };

    const response = createRes();
    await handler(req as never, response.res as never);

    expect(response.raw.statusCode).toBe(405);
    expect(response.raw.headers['Allow']).toBe('GET, OPTIONS');
    expect(response.raw.body).toEqual({ error: 'Method Not Allowed' });
  });

  it('應拒絕不在 allowlist 的 endpoint', async () => {
    const fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;

    const req = {
      method: 'GET',
      query: {
        service: 'weatherapi',
        endpoint: 'evil.json',
        q: 'Taipei',
      },
    };

    const response = createRes();
    await handler(req as never, response.res as never);

    expect(response.raw.statusCode).toBe(400);
    expect(response.raw.body).toEqual({ error: 'Invalid endpoint' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('應拒絕過多 query keys', async () => {
    const fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;

    const extraQuery = Object.fromEntries(
      Array.from({ length: 21 }, (_, index) => [`k${index}`, `v${index}`]),
    );

    const req = {
      method: 'GET',
      query: {
        service: 'weatherapi',
        endpoint: 'current.json',
        ...extraQuery,
      },
    };

    const response = createRes();
    await handler(req as never, response.res as never);

    expect(response.raw.statusCode).toBe(400);
    expect(response.raw.body).toEqual({ error: 'Too many query keys' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('應拒絕過長 query value', async () => {
    const fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;

    const req = {
      method: 'GET',
      query: {
        service: 'weatherapi',
        endpoint: 'current.json',
        q: 'a'.repeat(201),
      },
    };

    const response = createRes();
    await handler(req as never, response.res as never);

    expect(response.raw.statusCode).toBe(400);
    expect(response.raw.body).toEqual({ error: 'Query value too long' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('應拒絕過大 query payload', async () => {
    const fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;

    const req = {
      method: 'GET',
      query: {
        service: 'weatherapi',
        endpoint: 'current.json',
        a: 'x'.repeat(200),
        b: 'x'.repeat(200),
        c: 'x'.repeat(200),
        d: 'x'.repeat(200),
        e: 'x'.repeat(200),
        f: 'x'.repeat(200),
        g: 'x'.repeat(200),
        h: 'x'.repeat(200),
        i: 'x'.repeat(200),
        j: 'x'.repeat(200),
      },
    };

    const response = createRes();
    await handler(req as never, response.res as never);

    expect(response.raw.statusCode).toBe(400);
    expect(response.raw.body).toEqual({ error: 'Query too large' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('應拒絕過長 URL', async () => {
    process.env.CWA_API_KEY = 'test-cwa-key';
    const fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;

    const req = {
      method: 'GET',
      query: {
        service: 'cwa',
        endpoint: 'O-A0001-001',
        a: 'x'.repeat(196),
        b: 'x'.repeat(196),
        c: 'x'.repeat(196),
        d: 'x'.repeat(196),
        e: 'x'.repeat(196),
        f: 'x'.repeat(196),
        g: 'x'.repeat(196),
        h: 'x'.repeat(196),
        i: 'x'.repeat(196),
        j: 'x'.repeat(196),
      },
    };

    const response = createRes();
    await handler(req as never, response.res as never);

    expect(response.raw.statusCode).toBe(400);
    expect(response.raw.body).toEqual({ error: 'Request URL too long' });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
