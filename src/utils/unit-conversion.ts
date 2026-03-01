/**
 * 單位轉換工具函式
 */

/**
 * 攝氏轉華氏
 */
export function celsiusToFahrenheit(celsius: number): number {
  return (celsius * 9) / 5 + 32;
}

/**
 * 華氏轉攝氏
 */
export function fahrenheitToCelsius(fahrenheit: number): number {
  return ((fahrenheit - 32) * 5) / 9;
}

/**
 * 公里/小時轉公尺/秒
 */
export function kmhToMs(kmh: number): number {
  return kmh / 3.6;
}

/**
 * 公里/小時轉英里/小時
 */
export function kmhToMph(kmh: number): number {
  return kmh * 0.621371;
}

/**
 * 公尺/秒轉公里/小時
 */
export function msToKmh(ms: number): number {
  return ms * 3.6;
}

/**
 * 英里/小時轉公里/小時
 */
export function mphToKmh(mph: number): number {
  return mph / 0.621371;
}

/**
 * 格式化溫度值（帶單位符號）
 */
export function formatTemperature(value: number, unit: 'celsius' | 'fahrenheit'): string {
  const rounded = Math.round(value);
  const symbol = unit === 'celsius' ? '°C' : '°F';
  return `${rounded}${symbol}`;
}

/**
 * 格式化風速值（帶單位符號）
 */
export function formatWindSpeed(kmh: number, unit: 'kmh' | 'ms' | 'mph' = 'kmh'): string {
  let value: number;
  let symbol: string;

  switch (unit) {
    case 'ms':
      value = kmhToMs(kmh);
      symbol = 'm/s';
      break;
    case 'mph':
      value = kmhToMph(kmh);
      symbol = 'mph';
      break;
    case 'kmh':
    default:
      value = kmh;
      symbol = 'km/h';
  }

  return `${value.toFixed(1)} ${symbol}`;
}
