/**
 * 日期格式化工具函式
 */

const DAYS_OF_WEEK = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];

/**
 * 將 ISO 時間字串格式化為「下午 3:00」格式
 */
export function formatTime(isoString: string): string {
  const date = new Date(isoString);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const paddedMinutes = String(minutes).padStart(2, '0');

  const period = hours >= 12 ? '下午' : '上午';
  const displayHours = hours % 12 || 12;

  return `${period} ${displayHours}:${paddedMinutes}`;
}

/**
 * 將 ISO 時間字串格式化為 24 小時制的「16:00」。
 *
 * 逐時預報每格只有 43px 寬，「下午 4:00」會撐破格線。這種密集並排的情境，
 * 24 小時制不只是省空間 —— 一整排等寬的數字本身就構成可掃描的節奏。
 */
export function formatHourShort(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';
  return `${String(date.getHours()).padStart(2, '0')}:00`;
}

/**
 * 將 ISO 日期字串格式化為「2月27日（四）」格式
 */
export function formatDate(isoString: string): string {
  const date = new Date(isoString);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dayOfWeek = DAYS_OF_WEEK[date.getDay()] ?? '週日';
  const shortDayOfWeek = dayOfWeek.slice(-1);

  return `${month}月${day}日（${shortDayOfWeek}）`;
}

/**
 * 將 ISO 日期字串格式化為「2/27」格式
 */
export function formatShortDate(isoString: string): string {
  const date = new Date(isoString);
  const month = date.getMonth() + 1;
  const day = date.getDate();

  return `${month}/${day}`;
}

/**
 * 取得星期幾，若為今天回傳「今天」，明天回傳「明天」
 */
export function getDayOfWeek(isoString: string): string {
  const date = new Date(isoString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // 比較日期（不含時間）
  const dateOnly = date.toDateString();
  const todayOnly = today.toDateString();
  const tomorrowOnly = tomorrow.toDateString();

  if (dateOnly === todayOnly) {
    return '今天';
  }
  if (dateOnly === tomorrowOnly) {
    return '明天';
  }

  return DAYS_OF_WEEK[date.getDay()] ?? '週日';
}

/**
 * 純星期名稱（週一…週日），不做今天/明天的相對替換。
 *
 * 與 getDayOfWeek 的差別：後者會把今天/明天回傳成「今天」「明天」，用在需要
 * 相對語意的地方；但當畫面同時顯示相對敘述（今天/N 天前）時，星期那格再回傳
 * 「今天」就成了「今天 · 今天」的重複。這個函式永遠給星期，讓兩格各司其職。
 */
export function getWeekdayName(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';
  return DAYS_OF_WEEK[date.getDay()] ?? '';
}

/**
 * 判斷是否為今天
 */
export function isToday(isoString: string): boolean {
  const date = new Date(isoString);
  const today = new Date();

  return date.toDateString() === today.toDateString();
}

/**
 * 計算距離現在相差多少天（負數表示過去，正數表示未來）
 */
export function daysAgo(isoString: string): number {
  const date = new Date(isoString);
  const today = new Date();

  // 將兩個日期轉為 UTC 午夜時刻
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const diffTime = todayOnly.getTime() - dateOnly.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}
