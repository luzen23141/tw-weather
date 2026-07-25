import { getWeatherErrorMessage } from '@/utils/error-message';

describe('getWeatherErrorMessage', () => {
  const cases: [string, string, string][] = [
    ['設定缺失', 'PROXY_URL is not defined', '應用程式設定錯誤，請聯繫開發者。'],
    ['401', 'HTTP 401: Unauthorized', '認證失敗，請稍後再試。'],
    ['403', 'HTTP 403: Forbidden', '認證失敗，請稍後再試。'],
    ['瀏覽器斷線', 'Failed to fetch', '無法連線至資料來源，請檢查網路後重試。'],
    ['原生斷線', 'Network request failed', '無法連線至資料來源，請檢查網路後重試。'],
    ['上游壞閘道', 'HTTP 502: Bad Gateway', '天氣資料來源暫時無法連線，請稍後再試或切換資料來源。'],
    [
      '上游逾時',
      'HTTP 504: Gateway Timeout',
      '天氣資料來源暫時無法連線，請稍後再試或切換資料來源。',
    ],
    ['未選地點', '地點未定義', '尚未選擇地點，請先選擇你想查看的城市。'],
  ];

  it.each(cases)('%s 應轉為對應的中文訊息', (_label, raw, expected) => {
    expect(getWeatherErrorMessage(new Error(raw))).toBe(expected);
  });

  it('未知錯誤應回退為通用訊息', () => {
    expect(getWeatherErrorMessage(new Error('something exploded'))).toBe(
      '暫時無法取得資料，請稍後再試。',
    );
  });

  it('空訊息不應拋錯', () => {
    expect(getWeatherErrorMessage(new Error(''))).toBe('暫時無法取得資料，請稍後再試。');
  });

  /*
    所有回傳都必須是能直接顯示給使用者的中文句子 —— 這個函式存在的唯一理由
    就是不讓 `HTTP 502: Bad Gateway` 這種字串出現在畫面上。
  */
  it('任何輸入都不應洩漏原始技術字串', () => {
    const raws = [...cases.map(([, raw]) => raw), 'TypeError: undefined is not an object'];

    for (const raw of raws) {
      const message = getWeatherErrorMessage(new Error(raw));
      expect(message).not.toContain(raw);
      expect(message).toMatch(/[。？]$/);
    }
  });
});
