import type { DailyForecast, HistoricalDayWeather } from '@/api/types';
import { dayDetailFromForecast, dayDetailFromHistory } from '@/utils/day-detail';

const history: HistoricalDayWeather = {
  date: '2026-07-24',
  temperatureMax: 34.4,
  temperatureMin: 26.2,
  temperatureAvg: 30.1,
  weatherCode: 3,
  description: '陰天',
  precipitationSum: 1.25,
  windSpeedAvg: 5.6,
  humidityAvg: 72.4,
  source: 'open-meteo',
};

const forecast: DailyForecast = {
  date: '2026-07-26',
  temperatureMax: 36.2,
  temperatureMin: 27.4,
  weatherCode: 2,
  description: '多雲時陰',
  precipitationProbability: 30.4,
  precipitationSum: 0,
  windSpeedMax: 12.6,
};

const metricValue = (metrics: { key: string; value: string }[], key: string) =>
  metrics.find((m) => m.key === key)?.value;

describe('day-detail', () => {
  describe('dayDetailFromHistory', () => {
    it('應標記為觀測並保留原始日期與溫度', () => {
      const detail = dayDetailFromHistory(history);

      expect(detail.isObservation).toBe(true);
      expect(detail.date).toBe('2026-07-24');
      expect(detail.tempMax).toBe(34.4);
      expect(detail.tempMin).toBe(26.2);
      expect(detail.description).toBe('陰天');
    });

    it('指標應四捨五入並帶單位', () => {
      const { metrics } = dayDetailFromHistory(history);

      expect(metricValue(metrics, 'avg')).toBe('30°');
      expect(metricValue(metrics, 'humidity')).toBe('72%');
      expect(metricValue(metrics, 'wind')).toBe('6 km/h');
      // 降水保留一位小數 —— 0.1mm 與 1mm 對「要不要帶傘」是不同的量級
      expect(metricValue(metrics, 'precip')).toBe('1.3 mm');
    });

    it('日較差應由高低溫相減得出', () => {
      const { metrics } = dayDetailFromHistory(history);
      expect(metricValue(metrics, 'range')).toBe('8°');
    });

    /*
      觀測沒有降雨機率（已經發生的事沒有機率可言），也沒有 UV 上限。
      硬湊這兩格只會逼出假資料。
    */
    it('不應出現預報限定的指標', () => {
      const { metrics } = dayDetailFromHistory(history);
      expect(metrics.map((m) => m.key)).not.toContain('pop');
      expect(metrics.map((m) => m.key)).not.toContain('uv');
    });
  });

  describe('dayDetailFromForecast', () => {
    it('應標記為預報', () => {
      expect(dayDetailFromForecast(forecast).isObservation).toBe(false);
    });

    it('應包含降雨機率與最大風速', () => {
      const { metrics } = dayDetailFromForecast(forecast);

      expect(metricValue(metrics, 'pop')).toBe('30%');
      expect(metricValue(metrics, 'wind')).toBe('13 km/h');
    });

    /*
      UV 目前只有 Open-Meteo 的 daily 提供，CWA 完全沒有。缺值時整格不渲染，
      而不是顯示破折號或 0 —— 「UV 0」會被讀成「完全沒有紫外線」，那是錯的資訊。
    */
    it('缺 UV 時不應產生 UV 指標', () => {
      const { metrics } = dayDetailFromForecast(forecast);
      expect(metrics.map((m) => m.key)).not.toContain('uv');
    });

    it('有 UV 時應附加於指標末端', () => {
      const { metrics } = dayDetailFromForecast({ ...forecast, uvIndexMax: 8.6 });
      expect(metricValue(metrics, 'uv')).toBe('9');
    });

    it('觀測與預報應產出同一組共通欄位', () => {
      const a = dayDetailFromHistory(history);
      const b = dayDetailFromForecast(forecast);

      // 兩者共用同一個呈現元件，這些欄位必須都在
      for (const detail of [a, b]) {
        expect(detail).toEqual(
          expect.objectContaining({
            date: expect.any(String),
            weatherCode: expect.any(Number),
            description: expect.any(String),
            tempMax: expect.any(Number),
            tempMin: expect.any(Number),
            isObservation: expect.any(Boolean),
          }),
        );
        expect(detail.metrics.length).toBeGreaterThan(0);
      }
    });
  });
});
