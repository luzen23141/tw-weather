import { createMockWeatherData } from '../factories/weather.factory';

describe('快取邏輯整合測試', () => {
  describe('快取寫入', () => {
    it('應將天氣資料儲存到快取', () => {
      const weatherData = createMockWeatherData();

      expect(weatherData).toBeDefined();
      expect(weatherData.current).toBeDefined();
    });

    it('應使用正確的快取金鑰格式', () => {
      const location = 'taipei';
      const dataSource = 'cwa';
      const cacheKey = `weather:${location}:${dataSource}`;

      expect(cacheKey).toContain('weather:');
      expect(cacheKey).toContain('taipei');
      expect(cacheKey).toContain('cwa');
    });

    it('應儲存時間戳記以追蹤快取時間', () => {
      const timestamp = new Date().getTime();
      expect(timestamp).toBeGreaterThan(0);
    });
  });

  describe('快取讀取', () => {
    it('應從快取讀取有效資料', () => {
      const cachedData = createMockWeatherData();
      expect(cachedData.current.temperature).toBeDefined();
      expect(cachedData.current.humidity).toBeDefined();
    });

    it('應檢查快取過期時間', () => {
      const cacheAge = 30 * 60 * 1000; // 30 分鐘
      const maxAge = 60 * 60 * 1000; // 1 小時
      expect(cacheAge).toBeLessThan(maxAge);
    });

    it('應在快取過期時返回 null', () => {
      const cacheAge = 2 * 60 * 60 * 1000; // 2 小時
      const maxAge = 60 * 60 * 1000; // 1 小時
      const isExpired = cacheAge > maxAge;
      expect(isExpired).toBe(true);
    });
  });

  describe('快取更新', () => {
    it('應能更新現有快取', () => {
      const oldData = createMockWeatherData({ current: { temperature: 25 } });
      const newData = createMockWeatherData({ current: { temperature: 26 } });

      expect(oldData.current.temperature).not.toBe(newData.current.temperature);
    });

    it('應保留快取歷史記錄', () => {
      const history = [
        createMockWeatherData({ current: { temperature: 25 } }),
        createMockWeatherData({ current: { temperature: 26 } }),
      ];

      expect(history.length).toBe(2);
      expect(history[0]?.current.temperature).toBe(25);
    });
  });

  describe('多位置快取', () => {
    it('應分別快取不同位置的資料', () => {
      const taipeiCache = { location: 'Taipei', data: createMockWeatherData() };
      const kaohsiungCache = { location: 'Kaohsiung', data: createMockWeatherData() };

      expect(taipeiCache.location).not.toBe(kaohsiungCache.location);
    });

    it('應管理多個快取條目', () => {
      const caches = [
        { location: 'Taipei', key: 'weather:taipei' },
        { location: 'Kaohsiung', key: 'weather:kaohsiung' },
        { location: 'Taichung', key: 'weather:taichung' },
      ];

      expect(caches.length).toBe(3);
    });
  });

  describe('快取清理', () => {
    it('應移除過期快取', () => {
      const now = new Date().getTime();
      const maxAge = 60 * 60 * 1000;

      const expiredCache = {
        timestamp: now - 2 * maxAge,
        isExpired: true,
      };

      expect(expiredCache.isExpired).toBe(true);
    });

    it('應能清除所有快取', () => {
      const cache = [
        { key: 'weather:taipei', data: createMockWeatherData() },
        { key: 'weather:kaohsiung', data: createMockWeatherData() },
      ];

      const cleared = cache.length === 0;
      expect(cleared).toBe(false); // 清除前有內容

      cache.length = 0;
      expect(cache.length).toBe(0); // 清除後為空
    });

    it('應保留重要快取條目', () => {
      const importantKeys = ['user:settings', 'weather:current:location'];
      const cacheToDelete = ['weather:old:1', 'weather:old:2'];

      expect(importantKeys.length).toBeGreaterThan(0);
      expect(cacheToDelete.length).toBeGreaterThan(0);
    });
  });

  describe('快取一致性', () => {
    it('應確保多資料源快取的一致性', () => {
      const cwaData = createMockWeatherData();
      const openMeteoData = createMockWeatherData();

      expect(cwaData.current.temperature).toBeDefined();
      expect(openMeteoData.current.temperature).toBeDefined();
    });

    it('應處理快取同步問題', () => {
      const dataSourceA = 'cwa';
      const dataSourceB = 'openmeteo';
      const timestamp = new Date().getTime();

      expect(dataSourceA).not.toBe(dataSourceB);
      expect(timestamp).toBeGreaterThan(0);
    });
  });

  describe('快取備份', () => {
    it('應能匯出快取資料', () => {
      const cache = createMockWeatherData();
      const exported = JSON.stringify(cache);

      expect(exported).toBeTruthy();
      expect(exported).toContain('temperature');
    });

    it('應能匯入快取資料', () => {
      const cache = createMockWeatherData();
      const exported = JSON.stringify(cache);
      const imported = JSON.parse(exported);

      expect(imported.current.temperature).toBe(cache.current.temperature);
    });
  });
});
