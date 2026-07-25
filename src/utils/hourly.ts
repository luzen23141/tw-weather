/**
 * 逐時預報的共用定位邏輯。
 *
 * 後端回傳的逐時陣列**不是從「現在」開始**的 —— Open-Meteo 以當地日界為起點，
 * 回傳的第一筆是今日 00:00。任何「從現在往後看」的邏輯都必須先定位出現在的
 * 索引，否則會拿過去的時段當未來用。
 */

import { HourlyForecast } from '@/api/types';

/**
 * 找出「現在」在逐時陣列中的索引 —— 第一筆時間不早於 now 的項目。
 *
 * 全部都在過去時退回最後一筆（而非 -1），呼叫端才不用各自處理空集合。
 * 空陣列回傳 0。
 */
export function findNowIndex(
  forecasts: readonly HourlyForecast[],
  now: number = Date.now(),
): number {
  if (forecasts.length === 0) return 0;
  const index = forecasts.findIndex((f) => new Date(f.timestamp).getTime() >= now);
  return index === -1 ? forecasts.length - 1 : index;
}

/**
 * 取「現在」及其之後的時段。
 *
 * 刻意**不**沿用 `findNowIndex` 的 clamping fallback：那個 fallback 是為了讓列表
 * 永遠有一格可以高亮，而這裡若資料全部過期，正確答案是「沒有未來時段」而不是
 * 「最後一筆過期資料」—— 拿陳舊資料下結論比不下結論更糟。
 */
export function upcomingHours(
  forecasts: readonly HourlyForecast[],
  now: number = Date.now(),
): readonly HourlyForecast[] {
  return forecasts.filter((f) => {
    const time = new Date(f.timestamp).getTime();
    return !Number.isNaN(time) && time >= now;
  });
}

/**
 * 取「現在」前後一段時間範圍的逐時，用於首頁的精簡逐時。
 *
 * 首頁只需要「剛過去」與「接下來」——過去 pastHours 小時 + 未來 futureHours 小時。
 * 更遠的時段從完整逐時頁（/hourly）看，首頁不該把 168 小時全部塞進橫向條。
 *
 * **以時間過濾而非索引切片。** 聚合模式下多來源逐時合併後時間軸並不規則
 * （某些小時只有單一來源、甚至有缺口），用「現在的索引 ±N」會把「2 個時段前」
 * 誤當成「2 小時前」—— 實際可能差了好幾小時。以絕對時間界定範圍才符合
 * 「過去兩小時」的字面意思，不受資料疏密影響。
 */
export function hourWindow(
  forecasts: readonly HourlyForecast[],
  pastHours: number,
  futureHours: number,
  now: number = Date.now(),
): readonly HourlyForecast[] {
  const HOUR = 60 * 60 * 1000;
  const from = now - pastHours * HOUR;
  // 未來邊界含當前小時：加半小時緩衝，避免剛好落在整點時把「現在」排除
  const to = now + futureHours * HOUR + 30 * 60 * 1000;

  return forecasts.filter((f) => {
    const t = new Date(f.timestamp).getTime();
    return !Number.isNaN(t) && t >= from && t <= to;
  });
}
