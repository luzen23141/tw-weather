import type { HourlyForecast } from '@/api/types';

import { findNowIndex, hourWindow, upcomingHours } from './hourly';

const NOW = new Date(2026, 6, 23, 14, 0, 0).getTime();

function hour(hourOfDay: number): HourlyForecast {
  return {
    timestamp: new Date(2026, 6, 23, hourOfDay, 0, 0).toISOString(),
    temperature: 28,
    apparentTemperature: 31,
    weatherCode: 3,
    description: '多雲',
    precipitationProbability: 20,
    precipitation: 0,
    humidity: 70,
    windSpeed: 10,
    windDirection: 90,
  };
}

describe('findNowIndex', () => {
  it('空陣列回傳 0', () => {
    expect(findNowIndex([], NOW)).toBe(0);
  });

  it('找出第一筆不早於現在的索引 —— 後端從當日 00:00 起算', () => {
    const forecasts = [hour(0), hour(6), hour(12), hour(14), hour(18)];
    expect(findNowIndex(forecasts, NOW)).toBe(3);
  });

  it('恰好等於現在的時刻算「現在」而非過去', () => {
    expect(findNowIndex([hour(13), hour(14)], NOW)).toBe(1);
  });

  it('全部都在過去時退回最後一筆，讓列表永遠有一格可高亮', () => {
    expect(findNowIndex([hour(8), hour(10), hour(12)], NOW)).toBe(2);
  });

  /*
    以下三例是整點以外的時刻。上面的案例全把 NOW 釘在 14:00:00 整，而那正是
    「第一筆不早於 now」與「包含 now 的那一格」唯一會給出相同答案的時刻 ——
    一天當中其餘 59/60 的時間兩者都不同。
  */
  const MID_HOUR = new Date(2026, 6, 23, 14, 2, 0).getTime();

  it('14:02 時「現在」是 14:00 那格，不是 15:00', () => {
    const forecasts = [hour(13), hour(14), hour(15), hour(16)];
    expect(findNowIndex(forecasts, MID_HOUR)).toBe(1);
  });

  it('14:59 仍屬 14:00 那一小時', () => {
    const almostNext = new Date(2026, 6, 23, 14, 59, 59).getTime();
    expect(findNowIndex([hour(14), hour(15)], almostNext)).toBe(0);
  });

  it('資料尚未涵蓋現在（全部在未來）時退回第一筆', () => {
    expect(findNowIndex([hour(18), hour(20)], MID_HOUR)).toBe(0);
  });

  it('忽略無法解析的時間戳', () => {
    const broken = { ...hour(10), timestamp: 'not-a-date' };
    expect(findNowIndex([hour(13), broken, hour(15)], MID_HOUR)).toBe(0);
  });
});

describe('upcomingHours', () => {
  it('切掉過去時段', () => {
    const forecasts = [hour(0), hour(12), hour(14), hour(18)];
    expect(upcomingHours(forecasts, NOW).map((f) => new Date(f.timestamp).getHours())).toEqual([
      14, 18,
    ]);
  });

  it('全部過期時回傳空陣列 —— 不沿用 findNowIndex 的 clamping fallback', () => {
    expect(upcomingHours([hour(8), hour(12)], NOW)).toEqual([]);
  });

  it('忽略無法解析的時間戳', () => {
    const broken = { ...hour(18), timestamp: 'not-a-date' };
    expect(upcomingHours([broken, hour(18)], NOW)).toHaveLength(1);
  });
});

describe('hourWindow', () => {
  // NOW = 14:00
  it('以時間界定範圍：過去 2h（12:00）到未來 12h（26:00→隔天02:00）', () => {
    const forecasts = Array.from({ length: 24 }, (_, h) => hour(h));
    const w = hourWindow(forecasts, 2, 12, NOW).map((f) => new Date(f.timestamp).getHours());
    expect(w[0]).toBe(12);
    expect(w).toContain(14);
    // 未來 12h 上界 = 26:00，但資料只到 23:00
    expect(w[w.length - 1]).toBe(23);
    expect(w).not.toContain(11); // 超過 2h 前，排除
  });

  it('時間軸有缺口時仍按時間過濾，不受索引間距影響', () => {
    // 模擬聚合的不規則時間軸：04, 05 之後直接跳到 15, 16（缺 06-14）
    const forecasts = [hour(4), hour(5), hour(15), hour(16), hour(17)];
    const w = hourWindow(forecasts, 2, 12, NOW).map((f) => new Date(f.timestamp).getHours());
    // NOW=14，過去 2h=12:00 → 04/05 都在範圍外；15/16/17 在未來 12h 內
    expect(w).toEqual([15, 16, 17]);
  });

  it('空陣列回傳空', () => {
    expect(hourWindow([], 2, 12, NOW)).toEqual([]);
  });
});
