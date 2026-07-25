/**
 * 與昨日的氣溫比較。
 *
 * 「今天 31 度」本身沒有太多資訊量 —— 早上出門前真正要判斷的是「比昨天熱還冷、
 * 外套要不要帶」。首頁把昨日與今日並排顯示只解決了一半：使用者還是得自己相減。
 * 這裡直接給結論。
 *
 * 比最高溫而非當前溫度：使用者問的是「今天」會怎樣，不是「這一刻」跟昨天同時刻
 * 差多少。最高溫也是決定穿著的那個數字。
 */

/** 超過此溫差視為顯著變化，UI 可據此加強視覺 */
const SIGNIFICANT_DELTA = 5;

export interface DayComparison {
  /** 今日最高 − 昨日最高（整數） */
  delta: number;
  text: string;
  /** 溫差是否顯著到值得強調 */
  significant: boolean;
}

/**
 * @param todayMax 今日預報最高溫
 * @param yesterdayMax 昨日實際最高溫
 * @returns 缺任一值時回傳 null（昨日資料來自 history，可能缺席）
 */
export function compareWithYesterday(
  todayMax: number | undefined,
  yesterdayMax: number | undefined,
): DayComparison | null {
  if (todayMax === undefined || yesterdayMax === undefined) return null;
  if (Number.isNaN(todayMax) || Number.isNaN(yesterdayMax)) return null;

  // 先各自四捨五入再相減，而非相減後四捨五入。
  // 否則會出現「畫面上兩天都寫 30°，卻說比昨天熱 1°」這種自相矛盾 ——
  // 結論必須跟同一畫面上的數字對得起來，否則使用者會不信任整個 app。
  const delta = Math.round(todayMax) - Math.round(yesterdayMax);

  if (delta === 0) {
    return { delta, text: '氣溫跟昨天差不多', significant: false };
  }

  const magnitude = Math.abs(delta);
  return {
    delta,
    text: delta > 0 ? `比昨天熱 ${magnitude}°` : `比昨天涼 ${magnitude}°`,
    significant: magnitude >= SIGNIFICANT_DELTA,
  };
}
