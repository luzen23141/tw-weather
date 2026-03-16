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

/** Light mode 漸層 — 深藍紫基調 */
const LIGHT_GRADIENTS: Record<WeatherThemeType, [string, string, string]> = {
  sunny: ['#3A5098', '#4A60A8', '#5A70B8'],
  cloudy: ['#2A3875', '#3A4F8A', '#4A5F9A'],
  rainy: ['#253068', '#354580', '#455A95'],
  snowy: ['#3A4888', '#4A5898', '#5A68A8'],
  stormy: ['#1A2555', '#2A3568', '#3A4578'],
  foggy: ['#354080', '#455090', '#5560A0'],
};

/** Dark mode 漸層 — 深夜藍紫基調 */
const DARK_GRADIENTS: Record<WeatherThemeType, [string, string, string]> = {
  sunny: ['#0E1830', '#1A2540', '#1E2A48'],
  cloudy: ['#0E1428', '#1A2340', '#1E2A48'],
  rainy: ['#0A1225', '#152038', '#1A2845'],
  snowy: ['#101830', '#1A2540', '#202D50'],
  stormy: ['#080E20', '#101830', '#181F3A'],
  foggy: ['#101828', '#1A2238', '#1E2A42'],
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
