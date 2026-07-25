/**
 * 過去觀測 + 未來預報的統一時間軸。
 *
 * 「日期選擇」在概念上是一條連續的時間線：昨天、前天是實際觀測，今天與未來
 * 是預報。使用者不該為了看未來某天而換一個畫面 —— 同一條軸往右滑就是了。
 *
 * 兩種資料在同一格上長得一樣（日期、天氣、高低溫），差別只在點進去後看的是
 * 「實際發生」還是「預報」。這裡把它們正規化成同一種時間軸項目，並記住每一項
 * 的來源，讓詳情卡選對 renderer（dayDetailFromHistory / dayDetailFromForecast）。
 */

import { DailyForecast, HistoricalDayWeather } from '@/api/types';

export interface TimelineDay {
  /** YYYY-MM-DD */
  date: string;
  weatherCode: number;
  tempMax: number;
  tempMin: number;
  /** true = 實際觀測（過去），false = 預報（今日與未來） */
  isObservation: boolean;
  /** 原始資料，供詳情卡取用完整欄位 */
  history?: HistoricalDayWeather;
  forecast?: DailyForecast;
}

/**
 * 合併歷史與預報成一條由舊到新的時間軸。
 *
 * 兩者的日期範圍天然不重疊：歷史止於昨天、預報始於今天。若真的出現同一天
 * 同時有觀測與預報（時區邊界的極端情況），**以觀測為準** —— 已經發生的事實
 * 勝過預測。
 */
export function buildDayTimeline(
  history: readonly HistoricalDayWeather[],
  forecast: readonly DailyForecast[],
): TimelineDay[] {
  const byDate = new Map<string, TimelineDay>();

  for (const day of history) {
    byDate.set(day.date, {
      date: day.date,
      weatherCode: day.weatherCode,
      tempMax: day.temperatureMax,
      tempMin: day.temperatureMin,
      isObservation: true,
      history: day,
    });
  }

  for (const day of forecast) {
    // 觀測優先：已發生的事實勝過預測
    if (byDate.has(day.date) && byDate.get(day.date)?.isObservation) continue;
    byDate.set(day.date, {
      date: day.date,
      weatherCode: day.weatherCode,
      tempMax: day.temperatureMax,
      tempMin: day.temperatureMin,
      isObservation: false,
      forecast: day,
    });
  }

  return [...byDate.values()].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
}
