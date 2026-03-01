/**
 * CWA (中央氣象署) 天氣代碼 → WMO Weather Code 映射表
 * WMO codes 用於統一所有資料源的天氣代碼
 */

type WeatherCodeMappings = Record<number | string, number>;

/**
 * CWA 使用中央氣象局定義的天氣代碼，需轉換為 WMO 標準碼
 * 參考：CWA 公開資料說明文件
 *
 * WMO 代碼速查：
 * - 0: 晴天
 * - 1-3: 部分多雲/多雲
 * - 45/48: 霧
 * - 51-67: 毛毛雨/小雨/雨/凍雨
 * - 71-77: 小雪/中雪/大雪
 * - 80-82: 陣雨/陣風雨/陣冰雨
 * - 85-86: 陣小雪/陣大雪
 * - 95-99: 雷暴
 */

// CWA 天氣現象代碼 (F-D0047-089, F-D0047-091)
// 參考文件: https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-D0047-089
const cwaCodeToWmo: WeatherCodeMappings = {
  // 晴天
  '1': 0, // 晴天
  '2': 1, // 多雲
  '3': 2, // 陰天

  // 降雨
  '4': 45, // 霧
  '5': 51, // 毛毛雨
  '6': 61, // 雨
  '7': 71, // 小雪
  '8': 81, // 陣雨
  '9': 95, // 雷暴

  // 其他變化
  '10': 48, // 濃霧
  '11': 53, // 中雨
  '12': 63, // 中雨
  '13': 73, // 中雪
  '14': 82, // 陣風雨
  '15': 80, // 陣雨（小）
  '16': 85, // 陣雪（小）
  '17': 86, // 陣雪（大）
  '18': 65, // 凍雨
  '19': 66, // 凍毛毛雨
  '20': 77, // 大雪
  '21': 96, // 雷暴伴隨冰雹
  '22': 99, // 強雷暴
};

/**
 * 將 CWA 天氣代碼轉換為 WMO 標準碼
 * @param cwaCode CWA 天氣現象代碼（通常為字串 '1'-'22'）
 * @returns WMO 標準天氣代碼（0-99）
 */
export function mapCwaCodeToWmo(cwaCode: string | number): number {
  const key = String(cwaCode);
  return cwaCodeToWmo[key] ?? 3; // 預設為多雲（3）
}

/**
 * 依照 WMO 代碼取得天氣圖示與描述
 * @param wmoCode WMO 標準天氣代碼
 * @returns 天氣描述文字
 */
export function getWeatherDescription(wmoCode: number): string {
  if (wmoCode === 0) return '晴天';
  if (wmoCode >= 1 && wmoCode <= 3) return '多雲';
  if (wmoCode === 45 || wmoCode === 48) return '霧';
  if (wmoCode >= 51 && wmoCode <= 67) return '降雨';
  if (wmoCode >= 71 && wmoCode <= 77) return '降雪';
  if (wmoCode >= 80 && wmoCode <= 82) return '陣雨';
  if (wmoCode >= 85 && wmoCode <= 86) return '陣雪';
  if (wmoCode >= 95 && wmoCode <= 99) return '雷暴';
  return '未知';
}

/**
 * 判斷是否為降雨型態（用於 UI 圖示判斷）
 */
export function isRainy(wmoCode: number): boolean {
  return (
    (wmoCode >= 51 && wmoCode <= 67) || // 毛毛雨/雨/凍雨
    (wmoCode >= 80 && wmoCode <= 82) || // 陣雨
    (wmoCode >= 95 && wmoCode <= 99) // 雷暴
  );
}

/**
 * 判斷是否為降雪型態
 */
export function isSnowy(wmoCode: number): boolean {
  return (
    (wmoCode >= 71 && wmoCode <= 77) || // 雪
    (wmoCode >= 85 && wmoCode <= 86) // 陣雪
  );
}

/**
 * 判斷是否能見度受影響（霧）
 */
export function isFoggy(wmoCode: number): boolean {
  return wmoCode === 45 || wmoCode === 48;
}

/**
 * OpenWeatherMap 天氣代碼 → WMO Weather Code 映射表
 * 參考：https://openweathermap.org/weather-conditions
 */
const openWeatherMapCodeToWmo: WeatherCodeMappings = {
  // 晴天 (800 series)
  '800': 0, // Clear sky
  '801': 1, // Few clouds (11-25%)
  '802': 2, // Scattered clouds (25-50%)
  '803': 2, // Broken clouds (50-84%)
  '804': 3, // Overcast clouds (85-100%)

  // 毛毛雨 (300 series)
  '300': 51, // Light drizzle
  '301': 51, // Drizzle
  '302': 53, // Heavy drizzle
  '310': 51, // Light drizzle rain
  '311': 53, // Drizzle rain
  '312': 53, // Heavy drizzle rain
  '313': 51, // Shower rain and drizzle
  '314': 53, // Heavy shower rain and drizzle
  '321': 53, // Shower drizzle

  // 小雨到大雨 (500 series)
  '500': 61, // Light rain
  '501': 63, // Moderate rain
  '502': 65, // Heavy rain
  '503': 67, // Very heavy rain
  '504': 67, // Extreme rain
  '511': 66, // Freezing rain
  '520': 61, // Light intensity shower rain
  '521': 63, // Shower rain
  '522': 65, // Heavy intensity shower rain
  '531': 61, // Ragged shower rain

  // 小雪到大雪 (600 series)
  '600': 71, // Light snow
  '601': 73, // Snow
  '602': 75, // Heavy snow
  '611': 66, // Sleet
  '612': 66, // Light shower sleet
  '613': 66, // Shower sleet
  '615': 71, // Light rain and snow
  '616': 73, // Rain and snow
  '620': 71, // Light shower snow
  '621': 73, // Shower snow
  '622': 75, // Heavy shower snow

  // 大氣
  '701': 45, // Mist
  '711': 45, // Smoke
  '721': 45, // Haze
  '731': 45, // Sand dust whirls
  '741': 48, // Fog
  '751': 45, // Sand
  '761': 45, // Dust
  '762': 45, // Volcanic ash
  '771': 45, // Squalls
  '781': 45, // Tornado

  // 雷暴 (200 series)
  '200': 95, // Thunderstorm with light rain
  '201': 95, // Thunderstorm with rain
  '202': 96, // Thunderstorm with heavy rain
  '210': 95, // Light thunderstorm
  '211': 95, // Thunderstorm
  '212': 96, // Heavy thunderstorm
  '221': 99, // Ragged thunderstorm
  '230': 95, // Thunderstorm with light drizzle
  '231': 95, // Thunderstorm with drizzle
  '232': 96, // Thunderstorm with heavy drizzle
};

/**
 * 將 OpenWeatherMap 天氣代碼轉換為 WMO 標準碼
 * @param owmCode OpenWeatherMap 天氣代碼 (200-804)
 * @returns WMO 標準天氣代碼 (0-99)
 */
export function mapOpenWeatherMapCodeToWmo(owmCode: number): number {
  const key = String(owmCode);
  return openWeatherMapCodeToWmo[key] ?? 3; // 預設為多雲（3）
}

/**
 * WeatherAPI.com 天氣代碼 → WMO Weather Code 映射表
 * 參考：https://www.weatherapi.com/docs/weather_conditions.csv
 */
const weatherApiCodeToWmo: WeatherCodeMappings = {
  // 晴天/多雲
  '1000': 0, // Sunny
  '1003': 1, // Partly cloudy
  '1006': 2, // Cloudy
  '1009': 3, // Overcast

  // 霧
  '1030': 45, // Mist
  '1135': 48, // Fog
  '1147': 48, // Freezing fog

  // 毛毛雨
  '1150': 51, // Patchy light drizzle
  '1153': 53, // Light drizzle
  '1168': 53, // Heavy freezing drizzle
  '1171': 53, // Heavy freezing drizzle
  '1180': 51, // Patchy light rain
  '1183': 61, // Light rain
  '1186': 63, // Moderate rain
  '1189': 65, // Heavy rain

  // 小雨
  '1192': 61, // Moderate or heavy rain shower
  '1195': 65, // Heavy rain shower
  '1198': 66, // Light freezing rain
  '1201': 66, // Moderate or heavy freezing rain

  // 小雪
  '1204': 71, // Light sleet
  '1207': 73, // Moderate or heavy sleet
  '1210': 71, // Patchy light snow
  '1213': 71, // Light snow
  '1216': 73, // Moderate snow
  '1219': 75, // Heavy snow
  '1222': 71, // Patchy light snow with thunder
  '1225': 73, // Moderate or heavy snow with thunder
  '1237': 66, // Light ice pellets
  '1240': 51, // Light rain shower
  '1243': 63, // Moderate or heavy rain shower
  '1246': 65, // Torrential rain shower
  '1249': 71, // Light sleet showers
  '1252': 73, // Moderate or heavy sleet showers
  '1255': 71, // Light snow showers
  '1258': 73, // Moderate or heavy snow showers
  '1261': 85, // Light showers of ice pellets
  '1264': 86, // Moderate or heavy showers of ice pellets

  // 雷暴
  '1273': 95, // Patchy light rain with thunder
  '1276': 95, // Moderate or heavy rain with thunder
  '1279': 95, // Patchy light snow with thunder
  '1282': 96, // Moderate or heavy snow with thunder
};

/**
 * 將 WeatherAPI.com 天氣代碼轉換為 WMO 標準碼
 * @param waCode WeatherAPI 天氣代碼
 * @returns WMO 標準天氣代碼 (0-99)
 */
export function mapWeatherApiCodeToWmo(waCode: number): number {
  const key = String(waCode);
  return weatherApiCodeToWmo[key] ?? 3; // 預設為多雲（3）
}
