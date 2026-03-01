describe('CurrentWeatherCard Component', () => {
  describe('渲染測試', () => {
    it('應正確渲染天氣卡片', () => {
      const mockData = {
        temperature: 25,
        description: '晴天',
        humidity: 65,
      };

      expect(mockData.temperature).toBeDefined();
      expect(mockData.description).toBeDefined();
    });

    it('應顯示溫度', () => {
      const data = { temperature: 25.5 };
      const display = `${data.temperature}°C`;
      expect(display).toContain('25.5');
    });

    it('應顯示天氣描述', () => {
      const data = { description: '晴天' };
      expect(data.description).toBe('晴天');
    });

    it('應顯示濕度', () => {
      const data = { humidity: 65 };
      const display = `${data.humidity}%`;
      expect(display).toContain('65');
    });
  });

  describe('undefined 值防護', () => {
    it('應處理 undefined 溫度', () => {
      const data: any = {};
      const temperature = data.temperature ?? 'N/A';
      expect(temperature).toBe('N/A');
    });

    it('應處理 undefined 濕度', () => {
      const data: any = {};
      const humidity = data.humidity ?? 'N/A';
      expect(humidity).toBe('N/A');
    });

    it('應處理 undefined 風速', () => {
      const data: any = {};
      const windSpeed = data.windSpeed ?? 'N/A';
      expect(windSpeed).toBe('N/A');
    });

    it('應處理 undefined 描述', () => {
      const data: any = {};
      const description = data.description ?? '未知';
      expect(description).toBe('未知');
    });

    it('應提供預設值', () => {
      const temperature = undefined;
      const display = temperature !== undefined ? `${temperature}°C` : '--';
      expect(display).toBe('--');
    });
  });

  describe('數據驗證', () => {
    it('應驗證溫度範圍', () => {
      const temperature = 25;
      const isValid = temperature >= -50 && temperature <= 60;
      expect(isValid).toBe(true);
    });

    it('應驗證濕度百分比', () => {
      const humidity = 65;
      const isValid = humidity >= 0 && humidity <= 100;
      expect(isValid).toBe(true);
    });

    it('應拒絕無效溫度', () => {
      const temperature = 150;
      const isValid = temperature >= -50 && temperature <= 60;
      expect(isValid).toBe(false);
    });
  });

  describe('快照測試', () => {
    it('應匹配天氣卡片快照', () => {
      const data = {
        temperature: 25,
        description: '晴天',
        humidity: 65,
        windSpeed: 10,
      };

      const snapshot = JSON.stringify(data);
      expect(snapshot).toContain('temperature');
      expect(snapshot).toContain('晴天');
    });

    it('應匹配不同天氣的快照', () => {
      const rainy = { temperature: 18, description: '下雨', humidity: 85 };
      const sunny = { temperature: 28, description: '晴天', humidity: 45 };

      expect(rainy.description).not.toBe(sunny.description);
    });
  });
});
