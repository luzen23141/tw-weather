import type { DailyForecast, HistoricalDayWeather } from '@/api/types';

import { buildDayTimeline } from './day-timeline';

const hist = (date: string, max: number): HistoricalDayWeather => ({
  date,
  temperatureMax: max,
  temperatureMin: max - 5,
  temperatureAvg: max - 2,
  weatherCode: 3,
  description: '多雲',
  precipitationSum: 0,
  windSpeedAvg: 10,
  humidityAvg: 70,
  source: 'open-meteo',
});

const fc = (date: string, max: number): DailyForecast => ({
  date,
  temperatureMax: max,
  temperatureMin: max - 5,
  weatherCode: 1,
  description: '晴',
  precipitationProbability: 10,
  precipitationSum: 0,
  windSpeedMax: 12,
});

describe('buildDayTimeline', () => {
  it('合併過去觀測與未來預報，由舊到新排序', () => {
    const t = buildDayTimeline(
      [hist('2026-07-22', 33), hist('2026-07-23', 32)],
      [fc('2026-07-24', 34), fc('2026-07-25', 35)],
    );
    expect(t.map((d) => d.date)).toEqual(['2026-07-22', '2026-07-23', '2026-07-24', '2026-07-25']);
    expect(t.map((d) => d.isObservation)).toEqual([true, true, false, false]);
  });

  it('每一項都記住原始資料供詳情卡取用', () => {
    const [past, future] = buildDayTimeline([hist('2026-07-23', 32)], [fc('2026-07-24', 34)]);
    expect(past?.history?.temperatureAvg).toBe(30);
    expect(future?.forecast?.precipitationProbability).toBe(10);
  });

  it('同日同時有觀測與預報時以觀測為準 —— 事實勝過預測', () => {
    const t = buildDayTimeline([hist('2026-07-23', 30)], [fc('2026-07-23', 99)]);
    expect(t).toHaveLength(1);
    expect(t[0]?.isObservation).toBe(true);
    expect(t[0]?.tempMax).toBe(30);
  });

  it('任一側為空仍可運作', () => {
    expect(buildDayTimeline([], [fc('2026-07-24', 34)]).map((d) => d.date)).toEqual(['2026-07-24']);
    expect(buildDayTimeline([hist('2026-07-23', 32)], []).map((d) => d.date)).toEqual([
      '2026-07-23',
    ]);
    expect(buildDayTimeline([], [])).toEqual([]);
  });
});
