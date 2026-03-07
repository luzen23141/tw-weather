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
});
