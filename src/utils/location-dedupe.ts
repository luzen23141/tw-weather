/**
 * 地點去重。
 *
 * 「同一個地點」有兩種樣貌：
 * 1. 行政區相同 —— 搜尋加入的大安區（TAIWAN_CITIES 的定點座標）與 GPS 定位
 *    解析出的大安區（實際所在座標）是同一個關注對象，座標卻差了幾百公尺。
 *    只比座標永遠擋不住這種重複。
 * 2. 座標幾乎相同 —— 沒有行政區資訊時（境外或解析失敗），以距離判斷。
 *    精確浮點相等在 GPS 場景下毫無意義：同一個人站在原地連按兩次定位，
 *    座標都不會一樣。
 */

import type { Location } from '@/api/types';

/** 座標視為同點的閾值（度）。0.005° ≈ 500m，小於一個行政區的尺度。 */
const COORD_EPSILON = 0.005;

function normalizeName(value: string | undefined): string {
  // 台/臺混用是這個 app 的日常（CWA 用臺、使用者輸入用台）
  return (value ?? '').trim().replace(/^台/, '臺');
}

/** 兩地點是否應視為同一個 */
export function isSameLocation(a: Location, b: Location): boolean {
  const aTownship = normalizeName(a.township ?? a.district);
  const bTownship = normalizeName(b.township ?? b.district);
  const aCity = normalizeName(a.city);
  const bCity = normalizeName(b.city);

  // 兩邊都有完整行政區時，以行政區為準 —— 這是使用者心中的「同一個地點」
  if (aCity !== '' && aTownship !== '' && bCity !== '' && bTownship !== '') {
    return aCity === bCity && aTownship === bTownship;
  }

  return (
    Math.abs(a.latitude - b.latitude) < COORD_EPSILON &&
    Math.abs(a.longitude - b.longitude) < COORD_EPSILON
  );
}

/**
 * 移除清單中的重複地點，保留**先加入**的那筆。
 *
 * 保留先者而非後者：先加入的那筆是使用者主動選擇的形態
 * （通常來自搜尋、帶著乾淨的定點座標），後來的多半是重複操作。
 */
export function dedupeLocations(locations: readonly Location[]): Location[] {
  const result: Location[] = [];
  for (const candidate of locations) {
    if (!result.some((kept) => isSameLocation(kept, candidate))) {
      result.push(candidate);
    }
  }
  return result;
}
