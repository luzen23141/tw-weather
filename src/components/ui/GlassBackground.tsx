import { Platform, View, ViewProps, ViewStyle } from 'react-native';

import { gradientToCSS, getWeatherGradient } from '@/utils/weather-theme';

export interface GlassBackgroundProps extends ViewProps {
  className?: string;
  /**
   * 可選傳入 WMO 天氣代碼，依天氣狀況動態調整背景漸層色。
   * 不傳時使用預設深藍紫漸層。
   */
  weatherCode?: number | undefined;
}

/** 深藍紫漸層 — 匹配設計圖風格 */
const DEFAULT_GRADIENT_LIGHT =
  'linear-gradient(160deg, #2a3875 0%, #3a4f8a 25%, #4a5f9a 50%, #5a6faa 75%, #6a7fba 100%)';

/**
 * 頁面漸層背景元件。
 * 深藍紫漸層 + 低干擾毛玻璃背景。
 */
export function GlassBackground({
  className = '',
  style,
  children,
  weatherCode,
  ...props
}: GlassBackgroundProps) {
  const webGradient: ViewStyle =
    Platform.OS === 'web'
      ? ({
          backgroundImage:
            weatherCode !== undefined
              ? gradientToCSS(getWeatherGradient(weatherCode, false))
              : DEFAULT_GRADIENT_LIGHT,
        } as ViewStyle)
      : {};

  return (
    <View
      className={`flex-1 bg-md-background ${className}`.trim()}
      style={[webGradient, style]}
      {...props}
    >
      {children}
    </View>
  );
}
