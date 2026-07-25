import type { HourlyForecast } from '@/api/types';

import { todayApparentHigh } from './today-summary';

function hour(date: Date, apparentTemperature: number): HourlyForecast {
  return {
    timestamp: date.toISOString(),
    temperature: 28,
    apparentTemperature,
    weatherCode: 3,
    description: '多雲',
    precipitationProbability: 20,
    precipitation: 0,
    humidity: 70,
    windSpeed: 10,
    windDirection: 90,
  };
}

const NOW = new Date(2026, 6, 23, 14, 0, 0);

describe('todayApparentHigh', () => {
  it('空陣列回傳 undefined', () => {
    expect(todayApparentHigh([], NOW)).toBeUndefined();
  });

  it('取今日所有時段的最大體感', () => {
    const forecasts = [
      hour(new Date(2026, 6, 23, 10, 0), 29),
      hour(new Date(2026, 6, 23, 13, 0), 34),
      hour(new Date(2026, 6, 23, 16, 0), 31),
    ];
    expect(todayApparentHigh(forecasts, NOW)).toBe(34);
  });

  it('包含已經過去的時段 —— 這是「當日」最高而非「剩餘時段」最高', () => {
    const forecasts = [
      hour(new Date(2026, 6, 23, 12, 0), 36),
      hour(new Date(2026, 6, 23, 18, 0), 28),
    ];
    expect(todayApparentHigh(forecasts, NOW)).toBe(36);
  });

  it('排除隔日的時段', () => {
    const forecasts = [
      hour(new Date(2026, 6, 23, 12, 0), 30),
      hour(new Date(2026, 6, 24, 12, 0), 40),
    ];
    expect(todayApparentHigh(forecasts, NOW)).toBe(30);
  });

  it('今日完全沒有資料時回傳 undefined', () => {
    const forecasts = [hour(new Date(2026, 6, 24, 12, 0), 40)];
    expect(todayApparentHigh(forecasts, NOW)).toBeUndefined();
  });

  it('忽略無法解析的時間戳', () => {
    const broken = { ...hour(NOW, 99), timestamp: 'not-a-date' };
    const forecasts = [broken, hour(new Date(2026, 6, 23, 12, 0), 30)];
    expect(todayApparentHigh(forecasts, NOW)).toBe(30);
  });
});
