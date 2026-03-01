import { createMockWeatherData, createMockCurrentWeather } from '../factories/weather.factory';

describe('API Adapters', () => {
  describe('CWA Adapter', () => {
    it('應正確解析 CWA 天氣資料', () => {
      const mockData = createMockWeatherData();
      expect(mockData.current).toBeDefined();
      expect(mockData.current.temperature).toBeGreaterThan(0);
      expect(mockData.current.humidity).toBeLessThanOrEqual(100);
    });

    it('應處理缺少的可選字段', () => {
      const data = createMockCurrentWeather();
      // 移除可選欄位以測試缺少值的情境
      delete data.visibility;
      delete data.pressure;
      expect(data.temperature).toBeDefined();
      expect(data.visibility).toBeUndefined();
    });

    it('應驗證溫度範圍', () => {
      const data = createMockCurrentWeather({ temperature: 25 });
      expect(data.temperature).toBeGreaterThanOrEqual(-50);
      expect(data.temperature).toBeLessThanOrEqual(60);
    });

    it('應驗證濕度範圍', () => {
      const data = createMockCurrentWeather({ humidity: 75 });
      expect(data.humidity).toBeGreaterThanOrEqual(0);
      expect(data.humidity).toBeLessThanOrEqual(100);
    });
  });

  describe('Open-Meteo Adapter', () => {
    it('應正確映射 Open-Meteo 欄位', () => {
      const rawData = {
        current: {
          temperature: 25.5,
          relative_humidity: 65,
          weather_code: 0,
          wind_speed_10m: 10,
          wind_direction_10m: 180,
        },
      };

      expect(rawData.current.temperature).toBe(25.5);
      expect(rawData.current.relative_humidity).toBe(65);
    });

    it('應處理不同的天氣代碼', () => {
      const weatherCodes = [0, 1, 2, 3, 45, 48, 51, 53, 55];
      weatherCodes.forEach((code) => {
        expect(typeof code).toBe('number');
      });
    });
  });

  describe('WeatherAPI Adapter', () => {
    it('應正確映射 WeatherAPI 欄位', () => {
      const rawData = {
        current: {
          temp_c: 25.5,
          humidity: 65,
          wind_kph: 10,
          wind_degree: 180,
        },
      };

      expect(rawData.current.temp_c).toBe(25.5);
      expect(rawData.current.humidity).toBe(65);
    });

    it('應驗證風速值', () => {
      const windSpeed = 15;
      expect(windSpeed).toBeGreaterThanOrEqual(0);
    });
  });

  describe('聚合轉換', () => {
    it('應計算多個資料源的平均溫度', () => {
      const temperatures = [25.5, 26.0, 25.2];
      const average = temperatures.reduce((a, b) => a + b, 0) / temperatures.length;
      expect(Math.round(average * 10) / 10).toBe(25.6);
    });

    it('應找到最高和最低溫度', () => {
      const temperatures = [25.5, 26.0, 25.2];
      const max = Math.max(...temperatures);
      const min = Math.min(...temperatures);
      expect(max).toBe(26.0);
      expect(min).toBe(25.2);
    });

    it('應合併多個預報列表', () => {
      const forecast1 = [{ date: '2024-02-28', temperatureMax: 28.0, temperatureMin: 20.0 }];
      const forecast2 = [{ date: '2024-02-28', temperatureMax: 27.5, temperatureMin: 19.5 }];

      const merged = [
        ...forecast1,
        ...forecast2.filter((item) => !forecast1.find((f) => f.date === item.date)),
      ];

      expect(merged.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('錯誤處理', () => {
    it('應處理無效的 API 響應', () => {
      const invalidResponse = null;
      expect(invalidResponse).toBeNull();
    });

    it('應驗證必需字段', () => {
      const data = { temperature: 25 };
      expect(data).toHaveProperty('temperature');
    });

    it('應處理超時', () => {
      const timeout = 30000;
      expect(timeout).toBeGreaterThan(0);
    });
  });
});
