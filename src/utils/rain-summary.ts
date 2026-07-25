/**
 * 從逐時預報推導一句話的降雨摘要。
 *
 * 逐時列裡 16:00 是 60%、17:00 是 70% 這種資訊，要使用者自己掃描才看得出來。
 * 這裡直接給結論。
 *
 * 無雨時不回傳 null —— 「沒有雨」本身就是使用者想確認的答案，只是語氣要退為
 * 低調確認而非強調。
 */

import { HourlyForecast } from '@/api/types';
import { upcomingHours } from '@/utils/hourly';

/** 降雨機率達此值才算「會下雨」。低於此值視為雜訊，不觸發摘要。 */
const RAIN_THRESHOLD = 50;
/** 摘要的觀察範圍（小時） */
const LOOKAHEAD_HOURS = 12;

export interface RainSummary {
  /** true = 期間內會下雨（強調樣式）；false = 不會（低調確認樣式） */
  raining: boolean;
  text: string;
}

function formatHour(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return `${String(date.getHours()).padStart(2, '0')}:00`;
}

/**
 * @param forecasts 完整逐時預報（可含過去時段，會自動從「現在」起算）
 * @param lookahead 觀察範圍，預設 12 小時
 * @param now 現在時間，測試用
 */
export function buildRainSummary(
  forecasts: readonly HourlyForecast[],
  lookahead: number = LOOKAHEAD_HOURS,
  now: number = Date.now(),
): RainSummary | null {
  if (forecasts.length === 0) return null;

  // 後端回傳的陣列從當日 00:00 開始，不是從現在。不先切掉過去時段的話，
  // 正在下 100% 的雨時會因為讀了凌晨的資料而回報「無降雨」。
  const window = upcomingHours(forecasts, now).slice(0, lookahead);
  if (window.length === 0) return null;

  const startIndex = window.findIndex((f) => f.precipitationProbability >= RAIN_THRESHOLD);

  if (startIndex === -1) {
    return { raining: false, text: `未來 ${window.length} 小時無降雨` };
  }

  const start = window[startIndex];
  if (start === undefined) return null;

  // 從起點往後數連續達標的時數，中斷即停 —— 只描述第一段雨，
  // 「下午下、晚上又下」這種多段情況硬塞進一句話反而更難讀。
  let duration = 0;
  for (let i = startIndex; i < window.length; i += 1) {
    const item = window[i];
    if (item === undefined || item.precipitationProbability < RAIN_THRESHOLD) break;
    duration += 1;
  }

  // 第一筆就在下雨 —— 說「現在起轉雨」很奇怪，改成描述持續時間
  if (startIndex === 0) {
    return { raining: true, text: `目前有雨，約再持續 ${duration} 小時` };
  }

  return { raining: true, text: `${formatHour(start.timestamp)} 起轉雨，約持續 ${duration} 小時` };
}
