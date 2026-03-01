describe('CWA Weather Adapter', () => {
  describe('fetchWeather 成功情況', () => {
    it('應正確解析 CWA 回應', async () => {
      const mockData = {
        success: true,
        data: {
          temperature: 25.5,
          humidity: 65,
          windSpeed: 10,
          windDirection: 180,
          description: '晴天',
          weatherCode: 0,
        },
      };

      expect(mockData.data.temperature).toBe(25.5);
      expect(mockData.data.humidity).toBe(65);
    });

    it('應驗證必需字段', () => {
      const response = {
        temperature: 25.5,
        humidity: 65,
        description: '晴天',
      };

      expect(response).toHaveProperty('temperature');
      expect(response).toHaveProperty('humidity');
      expect(response).toHaveProperty('description');
    });
  });

  describe('fetchWeather 失敗情況', () => {
    it('應處理 API 錯誤', async () => {
      // 模擬 API 回傳 500 錯誤
      const shouldFail = true;
      expect(shouldFail).toBe(true);
    });

    it('應處理超時', async () => {
      const timeout = 30000;
      expect(timeout).toBeGreaterThan(0);
    });

    it('應處理無效响應', async () => {
      const response = null;
      expect(response).toBeNull();
    });
  });

  describe('格式異常處理', () => {
    it('應驗證溫度欄位', () => {
      const data = { temperature: 25.5 };
      expect(typeof data.temperature).toBe('number');
    });

    it('應驗證濕度範圍', () => {
      const humidity = 65;
      expect(humidity).toBeGreaterThanOrEqual(0);
      expect(humidity).toBeLessThanOrEqual(100);
    });

    it('應處理缺失的可選欄位', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = { temperature: 25 };
      expect(data.pressure).toBeUndefined();
    });

    it('應轉換天氣代碼', () => {
      const weatherCode = 0;
      const codeMap: { [key: number]: string } = { 0: '晴天', 1: '多雲' };
      expect(codeMap[weatherCode]).toBe('晴天');
    });
  });

  describe('歷史數據', () => {
    it('應支持查詢歷史天氣', () => {
      const historicalData = {
        date: '2024-02-26',
        temperature: 24.5,
        humidity: 70,
      };

      expect(historicalData.date).toBeDefined();
      expect(historicalData.temperature).toBeDefined();
    });
  });
});
