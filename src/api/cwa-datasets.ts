/**
 * CWA 縣市 → 預報 dataset ID 對照。
 *
 * ## 為什麼需要這張表
 *
 * CWA 的逐時／每日預報端點是**依縣市分成不同 dataset** 的，proxy 要求請求帶上
 * `locationId`（即 dataset ID）才能決定去打哪一支上游 API。而前端先前從未送出
 * 這個參數 —— 結果是 **CWA 的 hourly 與 daily 一律回 400**，只有 current 能用
 * （current 走測站，可由 lat/lon 解析）。
 *
 * 實際後果比看起來嚴重：聚合模式下 CWA 的預報全部失敗，聚合退化成只剩
 * Open-Meteo 一個來源 —— 也就是「多資料源」這個核心功能從來沒有真正運作過。
 *
 * ## 命名注意
 *
 * CWA 官方用「臺」而非「台」（臺北市 / 臺中市 / 臺南市 / 臺東縣），但使用者輸入與
 * 本專案的 `TAIWAN_CITIES` 多用「台」。查表時兩種寫法都要能命中。
 */

/** 逐時預報（3 日）dataset */
const THREE_DAY_BY_COUNTY: Record<string, string> = {
  宜蘭縣: 'F-D0047-001',
  桃園市: 'F-D0047-005',
  新竹縣: 'F-D0047-009',
  苗栗縣: 'F-D0047-013',
  彰化縣: 'F-D0047-017',
  南投縣: 'F-D0047-021',
  雲林縣: 'F-D0047-025',
  嘉義縣: 'F-D0047-029',
  屏東縣: 'F-D0047-033',
  臺東縣: 'F-D0047-037',
  花蓮縣: 'F-D0047-041',
  澎湖縣: 'F-D0047-045',
  基隆市: 'F-D0047-049',
  新竹市: 'F-D0047-053',
  嘉義市: 'F-D0047-057',
  臺北市: 'F-D0047-061',
  高雄市: 'F-D0047-065',
  新北市: 'F-D0047-069',
  臺中市: 'F-D0047-073',
  臺南市: 'F-D0047-077',
  連江縣: 'F-D0047-081',
  金門縣: 'F-D0047-085',
};

/** 每日預報（1 週）dataset */
const WEEKLY_BY_COUNTY: Record<string, string> = {
  宜蘭縣: 'F-D0047-003',
  桃園市: 'F-D0047-007',
  新竹縣: 'F-D0047-011',
  苗栗縣: 'F-D0047-015',
  彰化縣: 'F-D0047-019',
  南投縣: 'F-D0047-023',
  雲林縣: 'F-D0047-027',
  嘉義縣: 'F-D0047-031',
  屏東縣: 'F-D0047-035',
  臺東縣: 'F-D0047-039',
  花蓮縣: 'F-D0047-043',
  澎湖縣: 'F-D0047-047',
  基隆市: 'F-D0047-051',
  新竹市: 'F-D0047-055',
  嘉義市: 'F-D0047-059',
  臺北市: 'F-D0047-063',
  高雄市: 'F-D0047-067',
  新北市: 'F-D0047-071',
  臺中市: 'F-D0047-075',
  臺南市: 'F-D0047-079',
  連江縣: 'F-D0047-083',
  金門縣: 'F-D0047-087',
};

/** 把使用者慣用的「台」正規化為 CWA 官方的「臺」 */
function normalizeCounty(county: string): string {
  return county.trim().replace(/^台/, '臺');
}

export type CwaForecastKind = 'hourly' | 'daily';

/**
 * 依縣市名稱取得 CWA 預報 dataset ID。
 *
 * @returns 找不到對應縣市時回傳 undefined —— 呼叫端應據此略過 CWA 而非送出
 *          一個會被拒絕的請求。
 */
export function getCwaForecastLocationId(
  county: string | undefined,
  kind: CwaForecastKind,
): string | undefined {
  if (county === undefined || county === '') return undefined;
  const table = kind === 'hourly' ? THREE_DAY_BY_COUNTY : WEEKLY_BY_COUNTY;
  return table[normalizeCounty(county)];
}
