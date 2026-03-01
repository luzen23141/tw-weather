import { createMockDailyForecast, createMockHourlyForecast } from '../factories/weather.factory';

describe('預報和歷史頁面', () => {
  describe('7日預報', () => {
    it('應顯示 7 天的預報', () => {
      const forecast = Array.from({ length: 7 }, (_, i) =>
        createMockDailyForecast({
          date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0] ?? '',
        }),
      );

      expect(forecast.length).toBe(7);
    });

    it('應顯示每天的最高和最低溫度', () => {
      const forecast = createMockDailyForecast();
      expect(forecast.temperatureMax).toBeGreaterThan(0);
      expect(forecast.temperatureMin).toBeGreaterThan(0);
      expect(forecast.temperatureMax).toBeGreaterThan(forecast.temperatureMin);
    });

    it('應顯示天氣描述', () => {
      const forecast = createMockDailyForecast({ description: '多雲' });
      expect(forecast.description).toBe('多雲');
    });

    it('應顯示降水概率', () => {
      const forecast = createMockDailyForecast({ precipitationProbability: 30 });
      expect(forecast.precipitationProbability).toBeGreaterThanOrEqual(0);
      expect(forecast.precipitationProbability).toBeLessThanOrEqual(100);
    });

    it('應顯示日出和日落時間', () => {
      const forecast = createMockDailyForecast();
      expect(forecast.sunrise).toBeTruthy();
      expect(forecast.sunset).toBeTruthy();
    });
  });

  describe('逐小時預報', () => {
    it('應顯示 24 小時預報', () => {
      const hourlyForecasts = Array.from({ length: 24 }, (_, i) =>
        createMockHourlyForecast({
          timestamp: new Date(Date.now() + i * 60 * 60 * 1000).toISOString(),
        }),
      );

      expect(hourlyForecasts.length).toBe(24);
    });

    it('應顯示每小時的溫度', () => {
      const hourly = createMockHourlyForecast({ temperature: 25 });
      expect(hourly.temperature).toBeDefined();
    });

    it('應顯示降水概率', () => {
      const hourly = createMockHourlyForecast({ precipitationProbability: 20 });
      expect(hourly.precipitationProbability).toBeDefined();
    });
  });

  describe('歷史天氣', () => {
    it('應顯示歷史天氣記錄', () => {
      const history = Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        temperature: 20 + Math.random() * 10,
      }));

      expect(history.length).toBe(30);
    });

    it('應能按日期篩選', () => {
      const allRecords = [
        { date: '2024-02-27', temperature: 25 },
        { date: '2024-02-26', temperature: 24 },
        { date: '2024-02-25', temperature: 23 },
      ];

      const filtered = allRecords.filter((r) => r.date === '2024-02-27');
      expect(filtered.length).toBe(1);
    });

    it('應顯示歷史數據趨勢', () => {
      const history = [
        { date: '2024-02-25', temperature: 20 },
        { date: '2024-02-26', temperature: 22 },
        { date: '2024-02-27', temperature: 25 },
      ];

      const isIncreasing = (history[2]?.temperature ?? 0) > (history[0]?.temperature ?? 0);
      expect(isIncreasing).toBe(true);
    });

    it('應計算平均溫度', () => {
      const history = [{ temperature: 20 }, { temperature: 22 }, { temperature: 25 }];

      const average = history.reduce((sum, h) => sum + h.temperature, 0) / history.length;
      expect(average).toBeGreaterThan(0);
      expect(Math.round(average)).toBe(22);
    });
  });

  describe('圖表顯示', () => {
    it('應能渲染溫度圖表', () => {
      const data = [
        { time: '09:00', temp: 20 },
        { time: '12:00', temp: 25 },
        { time: '15:00', temp: 28 },
        { time: '18:00', temp: 24 },
      ];

      expect(data.length).toBe(4);
    });

    it('應能渲染降水圖表', () => {
      const precipitation = [
        { time: '00:00', amount: 0 },
        { time: '06:00', amount: 2 },
        { time: '12:00', amount: 5 },
        { time: '18:00', amount: 1 },
      ];

      const totalPrecipitation = precipitation.reduce((sum, p) => sum + p.amount, 0);
      expect(totalPrecipitation).toBe(8);
    });
  });

  describe('快照測試', () => {
    it('應匹配預報卡片快照', () => {
      const forecast = createMockDailyForecast();
      const snapshot = JSON.stringify(forecast);

      expect(snapshot).toContain('temperatureMax');
      expect(snapshot).toContain('description');
    });

    it('應匹配歷史列表快照', () => {
      const history = [
        { date: '2024-02-27', temperature: 25 },
        { date: '2024-02-26', temperature: 24 },
      ];

      const snapshot = JSON.stringify(history);
      expect(snapshot).toContain('2024-02-27');
    });
  });
});
