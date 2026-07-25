/**
 * 指標分級量表。
 *
 * 濕度、風速、UV 這類數值，一般人很難判斷「高還是低」。這裡把數值映射成
 * 分段刻度，讓相對位置一眼可讀。
 *
 * 設計原則：
 * - **段數依各指標的實際分級，不強行統一。** UV 有 WHO 官方五級、風速有蒲福
 *   風級，硬切成同樣段數等於捏造分級。
 * - **降水機率不設刻度。** 百分比的機率直覺人人都有，加刻度是冗餘；濕度雖然
 *   也是百分比，但「相對於飽和的比例」跟舒適感的關係並不直覺，所以保留刻度。
 * - **警示色只在真的需要動作時出現。** 目前僅 UV 進入「高」以上會轉琥珀色。
 *   色彩若變成裝飾就失去警示功能。
 */

export interface MetricScaleResult {
  /** 總段數 */
  segments: number;
  /** 填滿的段數（至少 1，避免最低值看起來像沒有資料） */
  filled: number;
  /** 是否進入警示區間 —— 決定填色是否轉為警示色 */
  warn: boolean;
  /** 該區間的中文描述，供 accessibilityLabel 使用（畫面上不顯示） */
  level: string;
}

/**
 * 依 thresholds 找出 value 落在第幾段（1-based）。
 *
 * `upperBounds` 是各段的「上界（含）」，但**只有前 N-1 段需要上界** —— 最後一段
 * 是開放區間（如 UV 11+），沒有上限。因此 N 段的分級只需要 N-1 個上界，超出
 * 所有上界時落在第 `length + 1` 段。
 */
function bucket(value: number, upperBounds: readonly number[]): number {
  for (let i = 0; i < upperBounds.length; i += 1) {
    const bound = upperBounds[i];
    if (bound !== undefined && value <= bound) return i + 1;
  }
  return upperBounds.length + 1;
}

/**
 * 濕度（%）—— 4 段，依體感舒適區間。
 *
 * 單向填充（越長越悶）是刻意的假設：台灣濕度常年落在 60–90，實務上確實是
 * 越高越不舒服。若之後要支援乾燥地區，這裡需要改成「游標標在刻度上、舒適區
 * 用亮底標示」，因為乾燥同樣不舒服，但單向填充會讓它看起來像「很好」。
 */
const HUMIDITY_BOUNDS = [40, 60, 80] as const;
const HUMIDITY_LEVELS = ['乾燥', '舒適', '偏濕', '潮濕'] as const;

export function humidityScale(humidity: number): MetricScaleResult {
  const filled = bucket(humidity, HUMIDITY_BOUNDS);
  return {
    segments: 4,
    filled,
    warn: false,
    level: HUMIDITY_LEVELS[filled - 1] ?? '未知',
  };
}

/**
 * 風速（km/h）—— 6 段。
 *
 * 蒲福風級正式有 13 級，畫成 13 格每格不到 3px 看不出來，所以歸併成 6 組。
 * 這是實用取捨，不是官方分組 —— UI 上不要標成「蒲福風級」以免誤導。
 */
const WIND_BOUNDS = [1, 11, 28, 49, 74] as const;
const WIND_LEVELS = ['平靜', '微風', '和風', '強風', '烈風', '暴風'] as const;

export function windScale(kmh: number): MetricScaleResult {
  const filled = bucket(kmh, WIND_BOUNDS);
  return {
    segments: 6,
    filled,
    warn: false,
    level: WIND_LEVELS[filled - 1] ?? '未知',
  };
}

/**
 * 紫外線指數 —— 5 段，WHO 官方分級（環境部亦採用）。
 * 這是四個指標裡唯一可以直接照抄的標準。
 */
const UV_BOUNDS = [2, 5, 7, 10] as const;
const UV_LEVELS = ['低量', '中量', '高量', '過量', '危險'] as const;
/** 進入「高量」（指數 6）以上即轉警示色 */
const UV_WARN_FROM_SEGMENT = 3;

export function uvScale(uvIndex: number): MetricScaleResult {
  const filled = bucket(uvIndex, UV_BOUNDS);
  return {
    segments: 5,
    filled,
    warn: filled >= UV_WARN_FROM_SEGMENT,
    level: UV_LEVELS[filled - 1] ?? '未知',
  };
}
