/**
 * 根據 WMO 天氣代碼和主題，回傳適合的漸層背景色
 */
export type WeatherThemeType = 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'stormy' | 'foggy';

export function getWeatherThemeType(weatherCode: number): WeatherThemeType {
  if (weatherCode === 0 || weatherCode === 1) return 'sunny';
  if (weatherCode === 2 || weatherCode === 3) return 'cloudy';
  if (weatherCode === 45 || weatherCode === 48) return 'foggy';
  if ((weatherCode >= 71 && weatherCode <= 77) || weatherCode === 85 || weatherCode === 86)
    return 'snowy';
  if (weatherCode >= 95) return 'stormy';
  if ((weatherCode >= 51 && weatherCode <= 67) || (weatherCode >= 80 && weatherCode <= 82))
    return 'rainy';
  return 'cloudy';
}

/** Light mode 漸層 */
const LIGHT_GRADIENTS: Record<WeatherThemeType, [string, string, string]> = {
  sunny: ['#FFF9E6', '#EEF4F8', '#E6F2FF'],
  cloudy: ['#EEF4F8', '#E8EEF4', '#EEF4F8'],
  rainy: ['#E8F0F8', '#DDE8F5', '#E8F0F8'],
  snowy: ['#EEF4FB', '#E8F0F8', '#EEF4FB'],
  stormy: ['#E4E8F0', '#D8E0EE', '#E4E8F0'],
  foggy: ['#F0F2F4', '#E8ECEE', '#F0F2F4'],
};

/** Dark mode 漸層 */
const DARK_GRADIENTS: Record<WeatherThemeType, [string, string, string]> = {
  sunny: ['#0F1A14', '#0B1520', '#0D1A24'],
  cloudy: ['#0B1520', '#0E1A28', '#0B1520'],
  rainy: ['#0A1525', '#0C1A30', '#0A1525'],
  snowy: ['#0D1626', '#0B1A2E', '#0D1626'],
  stormy: ['#090F1C', '#0C1228', '#090F1C'],
  foggy: ['#0E1620', '#121A22', '#0E1620'],
};

export function getWeatherGradient(weatherCode: number, isDark: boolean): [string, string, string] {
  const type = getWeatherThemeType(weatherCode);
  return isDark
    ? (DARK_GRADIENTS[type] ?? DARK_GRADIENTS.cloudy)
    : (LIGHT_GRADIENTS[type] ?? LIGHT_GRADIENTS.cloudy);
}

/** 漸層色轉 CSS linear-gradient 字串 */
export function gradientToCSS(colors: [string, string, string], angle = 135): string {
  return `linear-gradient(${angle}deg, ${colors[0]} 0%, ${colors[1]} 50%, ${colors[2]} 100%)`;
}
