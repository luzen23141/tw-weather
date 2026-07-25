/**
 * 由逐時預報推導「今日」層級的摘要值。
 */

import { HourlyForecast } from '@/api/types';

function isSameLocalDay(iso: string, reference: Date): boolean {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return false;
  return (
    date.getFullYear() === reference.getFullYear() &&
    date.getMonth() === reference.getMonth() &&
    date.getDate() === reference.getDate()
  );
}

/**
 * 今日最高體感溫度。
 *
 * 後端 daily 沒有請求 `apparent_temperature_max`，但 hourly 每筆都帶
 * `apparentTemperature`，取今日所有時段的最大值即可 —— 不需要改後端。
 *
 * 注意這是**當日**最高，包含已經過去的時段。下午看到的「最高 34°」可能是中午
 * 已經發生過的，不是接下來會遇到的。改成「剩餘時段最高」會讓這個數字在傍晚
 * 一路往下掉，反而更難讀，所以維持當日定義。
 *
 * 以 CWA 為來源時 apparentTemperature 是氣溫的 fallback，此值會失真。
 */
export function todayApparentHigh(
  forecasts: readonly HourlyForecast[],
  now: Date = new Date(),
): number | undefined {
  const todays = forecasts.filter((f) => isSameLocalDay(f.timestamp, now));
  if (todays.length === 0) return undefined;
  return Math.max(...todays.map((f) => f.apparentTemperature));
}
