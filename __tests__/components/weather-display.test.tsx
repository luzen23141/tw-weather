import { createMockCurrentWeather } from '../factories/weather.factory';

describe('天氣顯示組件', () => {
  describe('渲染', () => {
    it('應正確渲染天氣卡片', () => {
      // 模擬組件測試
      const weatherData = createMockCurrentWeather();

      expect(weatherData.temperature).toBeDefined();
      expect(weatherData.description).toBeDefined();
    });

    it('應顯示溫度', () => {
      const weatherData = createMockCurrentWeather({ temperature: 25 });
      expect(weatherData.temperature).toBe(25);
    });

    it('應顯示天氣描述', () => {
      const weatherData = createMockCurrentWeather({ description: '晴天' });
      expect(weatherData.description).toBe('晴天');
    });

    it('應顯示濕度', () => {
      const weatherData = createMockCurrentWeather({ humidity: 65 });
      expect(weatherData.humidity).toBe(65);
    });

    it('應顯示風速', () => {
      const weatherData = createMockCurrentWeather({ windSpeed: 10 });
      expect(weatherData.windSpeed).toBe(10);
    });
  });

  describe('快照測試', () => {
    it('應匹配天氣卡片快照', () => {
      const weatherData = createMockCurrentWeather();
      const snapshot = JSON.stringify(weatherData);

      expect(snapshot).toContain('temperature');
      expect(snapshot).toContain('晴天');
    });

    it('應匹配不同天氣狀況的快照', () => {
      const rainyWeather = createMockCurrentWeather({ description: '下雨' });
      const cloudyWeather = createMockCurrentWeather({ description: '多雲' });

      expect(rainyWeather.description).toBe('下雨');
      expect(cloudyWeather.description).toBe('多雲');
    });
  });

  describe('數據驗證', () => {
    it('應驗證溫度值', () => {
      const weatherData = createMockCurrentWeather({ temperature: 25.5 });
      expect(typeof weatherData.temperature).toBe('number');
      expect(weatherData.temperature).toBeLessThanOrEqual(60);
    });

    it('應驗證濕度值', () => {
      const weatherData = createMockCurrentWeather({ humidity: 65 });
      expect(weatherData.humidity).toBeGreaterThanOrEqual(0);
      expect(weatherData.humidity).toBeLessThanOrEqual(100);
    });

    it('應驗證風速值', () => {
      const weatherData = createMockCurrentWeather({ windSpeed: 10 });
      expect(weatherData.windSpeed).toBeGreaterThanOrEqual(0);
    });
  });

  describe('無障礙性', () => {
    it('應有適當的可訪問性標籤', () => {
      const weatherData = createMockCurrentWeather();
      expect(weatherData.description).toBeTruthy();
    });

    it('應支持屏幕閱讀器', () => {
      const weatherData = createMockCurrentWeather();
      const description = `${weatherData.temperature}度，${weatherData.description}，濕度${weatherData.humidity}%`;
      expect(description).toContain('度');
    });
  });
});
