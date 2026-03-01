/**
 * WMO 天氣代碼與 emoji、描述文字的映射
 */

export interface WeatherCodeInfo {
  emoji: string;
  description: string;
  isRaining: boolean;
}

export function getWeatherCodeInfo(weatherCode: number): WeatherCodeInfo {
  // 晴天
  if (weatherCode === 0) {
    return { emoji: '☀️', description: '晴天', isRaining: false };
  }

  // 部分多雲 / 多雲
  if (weatherCode === 1) {
    return { emoji: '🌤️', description: '多雲', isRaining: false };
  }
  if (weatherCode === 2) {
    return { emoji: '⛅', description: '多雲', isRaining: false };
  }
  if (weatherCode === 3) {
    return { emoji: '☁️', description: '陰天', isRaining: false };
  }

  // 霧
  if (weatherCode === 45 || weatherCode === 48) {
    return { emoji: '🌫️', description: '霧', isRaining: false };
  }

  // 毛毛雨 (51-55)
  if (weatherCode === 51 || weatherCode === 55) {
    return { emoji: '🌦️', description: '毛毛雨', isRaining: true };
  }

  // 小雨 (56-57: 凍毛毛雨)
  if (weatherCode === 56 || weatherCode === 57) {
    return { emoji: '🌦️', description: '凍毛毛雨', isRaining: true };
  }

  // 小雨 (61)
  if (weatherCode === 61) {
    return { emoji: '🌧️', description: '小雨', isRaining: true };
  }

  // 中雨 (63)
  if (weatherCode === 63) {
    return { emoji: '🌧️', description: '中雨', isRaining: true };
  }

  // 大雨 (65)
  if (weatherCode === 65) {
    return { emoji: '⛈️', description: '大雨', isRaining: true };
  }

  // 凍雨 (66)
  if (weatherCode === 66) {
    return { emoji: '🌧️', description: '凍雨', isRaining: true };
  }

  // 凍毛毛雨 (67)
  if (weatherCode === 67) {
    return { emoji: '🌦️', description: '凍毛毛雨', isRaining: true };
  }

  // 小雪 (71)
  if (weatherCode === 71) {
    return { emoji: '🌨️', description: '小雪', isRaining: false };
  }

  // 中雪 (73)
  if (weatherCode === 73) {
    return { emoji: '🌨️', description: '中雪', isRaining: false };
  }

  // 大雪 (75)
  if (weatherCode === 75) {
    return { emoji: '❄️', description: '大雪', isRaining: false };
  }

  // 雨夾雪 (77)
  if (weatherCode === 77) {
    return { emoji: '🌨️', description: '雨夾雪', isRaining: false };
  }

  // 陣雨 (80)
  if (weatherCode === 80) {
    return { emoji: '🌧️', description: '陣雨', isRaining: true };
  }

  // 陣風雨 (81)
  if (weatherCode === 81) {
    return { emoji: '⛈️', description: '陣風雨', isRaining: true };
  }

  // 陣冰雨 (82)
  if (weatherCode === 82) {
    return { emoji: '⛈️', description: '陣冰雨', isRaining: true };
  }

  // 陣小雪 (85)
  if (weatherCode === 85) {
    return { emoji: '🌨️', description: '陣小雪', isRaining: false };
  }

  // 陣大雪 (86)
  if (weatherCode === 86) {
    return { emoji: '❄️', description: '陣大雪', isRaining: false };
  }

  // 雷暴 (95)
  if (weatherCode === 95) {
    return { emoji: '⛈️', description: '雷暴', isRaining: true };
  }

  // 雷暴伴隨冰雹 (96)
  if (weatherCode === 96) {
    return { emoji: '⛈️', description: '雷暴伴隨冰雹', isRaining: true };
  }

  // 強雷暴 (99)
  if (weatherCode === 99) {
    return { emoji: '⛈️', description: '強雷暴', isRaining: true };
  }

  // 其他未定義的代碼
  return { emoji: '❓', description: '未知', isRaining: false };
}

/** 取得天氣描述文字 */
export function getWeatherDescription(weatherCode: number): string {
  return getWeatherCodeInfo(weatherCode).description;
}

/** 判斷是否為嚴重天氣（大雪、陣雪、陣雨、雷暴等） */
export function isSevereWeather(weatherCode: number): boolean {
  return (
    (weatherCode >= 71 && weatherCode <= 77) || // 雪
    (weatherCode >= 80 && weatherCode <= 82) || // 陣雨
    weatherCode >= 85 // 陣雪、雷暴
  );
}
