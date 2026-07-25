/**
 * 逐時預報的共用定位邏輯。
 *
 * 後端回傳的逐時陣列**不是從「現在」開始**的 —— Open-Meteo 以當地日界為起點，
 * 回傳的第一筆是今日 00:00。任何「從現在往後看」的邏輯都必須先定位出現在的
 * 索引，否則會拿過去的時段當未來用。
 */

import { HourlyForecast } from '@/api/types';

/**
 * 找出「現在」在逐時陣列中的索引 —— **包含 now 的那個小時區間**，
 * 也就是最後一筆時間不晚於 now 的項目。
 *
 * 先前取的是「第一筆不早於 now」，那在整點時正確、其餘 59 分鐘都會多跳一格：
 * 01:02 時 01:00 被判為過去、02:00 被標成「現在」。於是逐時列高亮的是還沒發生
 * 的下一小時，首頁大卡拿來補降雨機率的 `currentHour` 也取到下一小時的值。
 * 舊測試全把 now 釘在整點，剛好是唯一測不出這個偏差的時刻。
 *
 * 邊界：全部都在過去時退回最後一筆（而非 -1），呼叫端才不用各自處理空集合；
 * 全部都在未來（資料尚未涵蓋現在）時退回第一筆。空陣列回傳 0。
 */
export function findNowIndex(
  forecasts: readonly HourlyForecast[],
  now: number = Date.now(),
): number {
  if (forecasts.length === 0) return 0;

  let currentIndex = -1;
  forecasts.forEach((f, index) => {
    const time = new Date(f.timestamp).getTime();
    if (!Number.isNaN(time) && time <= now) currentIndex = index;
  });

  // 全部都在未來 —— 最接近「現在」的就是第一筆
  return currentIndex === -1 ? 0 : currentIndex;
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
