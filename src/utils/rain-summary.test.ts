import type { HourlyForecast } from '@/api/types';

import { buildRainSummary } from './rain-summary';

/** 測試基準時間：2026-07-23 14:00 */
const NOW = new Date(2026, 6, 23, 14, 0, 0).getTime();

function hour(hourOfDay: number, precipitationProbability: number): HourlyForecast {
  const timestamp = new Date(2026, 6, 23, hourOfDay, 0, 0).toISOString();
  return {
    timestamp,
    temperature: 28,
    apparentTemperature: 31,
    weatherCode: 3,
    description: '多雲',
    precipitationProbability,
    precipitation: 0,
    humidity: 70,
    windSpeed: 10,
    windDirection: 90,
  };
}

describe('buildRainSummary', () => {
  it('空陣列回傳 null', () => {
    expect(buildRainSummary([], 12, NOW)).toBeNull();
  });

  it('自動略過過去時段 —— 後端陣列從當日 00:00 起算，不是從現在', () => {
    const forecasts = [
      // 凌晨無雨。若誤把這些當成「未來」，正下著 100% 的雨時會回報無降雨
      hour(2, 0),
      hour(6, 5),
      hour(10, 10),
      hour(14, 100),
      hour(15, 90),
      hour(16, 20),
    ];
    expect(buildRainSummary(forecasts, 12, NOW)).toEqual({
      raining: true,
      text: '目前有雨，約再持續 2 小時',
    });
  });

  it('全部時段都已過去時回傳 null，不拿陳舊資料下結論', () => {
    expect(buildRainSummary([hour(2, 90), hour(6, 90)], 12, NOW)).toBeNull();
  });

  it('全程低於門檻時回傳無降雨，且語氣為非強調', () => {
    const result = buildRainSummary([hour(14, 10), hour(15, 20), hour(16, 45)], 12, NOW);
    expect(result).toEqual({ raining: false, text: '未來 3 小時無降雨' });
  });

  it('找出第一段降雨的起始時間與連續時數', () => {
    const result = buildRainSummary(
      [hour(14, 20), hour(15, 10), hour(16, 60), hour(17, 70), hour(18, 55), hour(19, 20)],
      12,
      NOW,
    );
    expect(result).toEqual({ raining: true, text: '16:00 起轉雨，約持續 3 小時' });
  });

  it('雨勢中斷後不把第二段併入時數 —— 一句話塞多段反而更難讀', () => {
    const result = buildRainSummary(
      [hour(14, 10), hour(15, 80), hour(16, 20), hour(17, 90), hour(18, 90)],
      12,
      NOW,
    );
    expect(result?.text).toBe('15:00 起轉雨，約持續 1 小時');
  });

  it('第一筆就在下雨時改成描述持續時間，不說「現在起轉雨」', () => {
    const result = buildRainSummary([hour(14, 80), hour(15, 70), hour(16, 30)], 12, NOW);
    expect(result).toEqual({ raining: true, text: '目前有雨，約再持續 2 小時' });
  });

  it('恰好落在門檻值視為會下雨', () => {
    const result = buildRainSummary([hour(14, 10), hour(15, 50)], 12, NOW);
    expect(result?.raining).toBe(true);
  });

  it('觀察範圍可調，超出範圍的降雨不納入', () => {
    const forecasts = [hour(14, 10), hour(15, 10), hour(16, 90)];
    expect(buildRainSummary(forecasts, 2, NOW)?.raining).toBe(false);
    expect(buildRainSummary(forecasts, 3, NOW)?.raining).toBe(true);
  });
});
