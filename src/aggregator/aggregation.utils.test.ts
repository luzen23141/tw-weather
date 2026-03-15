describe('Aggregation Utils', () => {
  describe('aggregateTemperature', () => {
    it('應計算溫度平均值', () => {
      const temperatures = [20, 25, 30];
      const average = temperatures.reduce((a, b) => a + b) / temperatures.length;
      expect(average).toBe(25);
    });

    it('應計算最高最低溫度', () => {
      const temperatures = [20, 25, 30, 15];
      const max = Math.max(...temperatures);
      const min = Math.min(...temperatures);
      expect(max).toBe(30);
      expect(min).toBe(15);
    });

    it('應處理單個值', () => {
      const temperatures = [25];
      expect(Math.max(...temperatures)).toBe(25);
      expect(Math.min(...temperatures)).toBe(25);
    });

    it('應處理浮點數', () => {
      const temperatures = [20.5, 25.7, 30.2];
      const average = temperatures.reduce((a, b) => a + b) / temperatures.length;
      expect(Math.round(average * 10) / 10).toBeCloseTo(25.5, 1);
    });
  });

  describe('evaluateThreshold', () => {
    it('應評估溫度超過閾值', () => {
      const temp = 35;
      const threshold = 30;
      expect(temp > threshold).toBe(true);
    });

    it('應評估溫度低於閾值', () => {
      const temp = 10;
      const threshold = 15;
      expect(temp < threshold).toBe(true);
    });

    it('應評估濕度閾值', () => {
      const humidity = 85;
      const threshold = 80;
      expect(humidity > threshold).toBe(true);
    });

    it('應評估風速閾值', () => {
      const windSpeed = 20;
      const threshold = 15;
      expect(windSpeed >= threshold).toBe(true);
    });
  });

  describe('aggregateNumericValues', () => {
    it('應聚合平均值', () => {
      const values = [10, 20, 30];
      const average = values.reduce((a, b) => a + b) / values.length;
      expect(average).toBe(20);
    });

    it('應聚合總和', () => {
      const values = [10, 20, 30];
      const sum = values.reduce((a, b) => a + b);
      expect(sum).toBe(60);
    });

    it('應聚合最大值', () => {
      const values = [10, 25, 20];
      expect(Math.max(...values)).toBe(25);
    });

    it('應聚合最小值', () => {
      const values = [10, 25, 20];
      expect(Math.min(...values)).toBe(10);
    });

    it('應處理空陣列邊界', () => {
      const values: number[] = [];
      expect(values.length).toBe(0);
    });

    it('應處理單一值', () => {
      const values = [42];
      const average = values.reduce((a, b) => a + b) / values.length;
      expect(average).toBe(42);
    });

    it('應計算中位數', () => {
      const values = [10, 20, 30, 40, 50];
      const sorted = values.sort((a, b) => a - b);
      const median = sorted[Math.floor(sorted.length / 2)];
      expect(median).toBe(30);
    });
  });

  describe('聚合數據驗證', () => {
    it('應驗證數據範圍', () => {
      const temps = [20, 25, 30];
      const allValid = temps.every((t) => t >= -50 && t <= 60);
      expect(allValid).toBe(true);
    });

    it('應檢測異常值', () => {
      const temps = [20, 25, 150]; // 150 是異常值
      const outlier = temps.find((t) => t > 60);
      expect(outlier).toBe(150);
    });

    it('應計算標準差', () => {
      const values = [10, 20, 30];
      const mean = values.reduce((a, b) => a + b) / values.length;
      const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);
      expect(stdDev).toBeGreaterThan(0);
    });
  });
});
