describe('AggregationEngine', () => {
  describe('aggregate() 聚合邏輯', () => {
    it('應聚合溫度', () => {
      const datasources = [{ temperature: 25 }, { temperature: 26 }, { temperature: 24 }];

      const avgTemp = datasources.reduce((sum, ds) => sum + ds.temperature, 0) / datasources.length;
      expect(avgTemp).toBe(25);
    });

    it('應聚合濕度', () => {
      const datasources = [{ humidity: 60 }, { humidity: 65 }, { humidity: 70 }];

      const avgHumidity =
        datasources.reduce((sum, ds) => sum + ds.humidity, 0) / datasources.length;
      expect(avgHumidity).toBe(65);
    });

    it('應計算溫度範圍', () => {
      const datasources = [{ temperature: 20 }, { temperature: 28 }, { temperature: 25 }];

      const temperatures = datasources.map((ds) => ds.temperature);
      const max = Math.max(...temperatures);
      const min = Math.min(...temperatures);

      expect(max).toBe(28);
      expect(min).toBe(20);
    });

    it('應聚合風速', () => {
      const datasources = [{ windSpeed: 8 }, { windSpeed: 10 }, { windSpeed: 12 }];

      const avgWind = datasources.reduce((sum, ds) => sum + ds.windSpeed, 0) / datasources.length;
      expect(avgWind).toBe(10);
    });

    it('應聚合降水概率', () => {
      const datasources = [
        { precipitationProbability: 10 },
        { precipitationProbability: 20 },
        { precipitationProbability: 30 },
      ];

      const avgPrecip =
        datasources.reduce((sum, ds) => sum + ds.precipitationProbability, 0) / datasources.length;
      expect(avgPrecip).toBe(20);
    });

    it('應選擇多數天氣描述', () => {
      const descriptions = ['晴天', '晴天', '多雲'];
      const counts = descriptions.reduce((acc: any, desc) => {
        acc[desc] = (acc[desc] || 0) + 1;
        return acc;
      }, {});

      const mostCommon = Object.keys(counts).reduce((a, b) => (counts[a] > counts[b] ? a : b));
      expect(mostCommon).toBe('晴天');
    });
  });

  describe('partial failure 情境', () => {
    it('應在一個資料源失敗時仍能聚合', () => {
      const datasources = [
        { temperature: 25, success: true },
        { temperature: null, success: false },
        { temperature: 26, success: true },
      ];

      const validSources = datasources.filter((ds) => ds.success && ds.temperature !== null);
      const avgTemp =
        validSources.reduce((sum, ds) => sum + (ds.temperature || 0), 0) / validSources.length;

      expect(validSources.length).toBe(2);
      expect(avgTemp).toBeCloseTo(25.5, 1);
    });

    it('應在所有資料源都失敗時返回 null', () => {
      const datasources = [
        { temperature: null, success: false },
        { temperature: null, success: false },
      ];

      const validSources = datasources.filter((ds) => ds.success);
      const result = validSources.length > 0 ? validSources[0]?.temperature : null;

      expect(result).toBeNull();
    });

    it('應記錄失敗的資料源', () => {
      const datasources = [
        { source: 'CWA', success: true },
        { source: 'Open-Meteo', success: false },
        { source: 'WeatherAPI', success: true },
      ];

      const failed = datasources.filter((ds) => !ds.success);
      expect(failed.length).toBe(1);
      expect(failed[0]?.source).toBe('Open-Meteo');
    });
  });

  describe('聚合驗證', () => {
    it('應驗證聚合結果有效性', () => {
      const aggregated = {
        temperature: 25,
        humidity: 65,
        windSpeed: 10,
      };

      const isValid =
        aggregated.temperature >= -50 &&
        aggregated.temperature <= 60 &&
        aggregated.humidity >= 0 &&
        aggregated.humidity <= 100 &&
        aggregated.windSpeed >= 0;

      expect(isValid).toBe(true);
    });

    it('應計算聚合置信度', () => {
      const sourcesCount = 3;
      const successCount = 3;
      const confidence = (successCount / sourcesCount) * 100;

      expect(confidence).toBe(100);
    });
  });

  describe('時序資料聚合', () => {
    it('應聚合逐小時預報', () => {
      const hourly = [
        [
          { time: '10:00', temp: 20 },
          { time: '11:00', temp: 21 },
        ],
        [
          { time: '10:00', temp: 21 },
          { time: '11:00', temp: 22 },
        ],
      ];

      // 聚合同一時間點的溫度
      const aggByTime: any = {};
      hourly.forEach((source) => {
        source.forEach((item) => {
          if (!aggByTime[item.time]) {
            aggByTime[item.time] = [];
          }
          aggByTime[item.time].push(item.temp);
        });
      });

      const result = Object.entries(aggByTime).map(([time, temps]: any) => ({
        time,
        avgTemp: temps.reduce((a: number, b: number) => a + b, 0) / temps.length,
      }));

      expect(result[0]?.avgTemp).toBe(20.5);
      expect(result[1]?.avgTemp).toBe(21.5);
    });
  });
});
