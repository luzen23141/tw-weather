import { Platform, View, ViewProps, ViewStyle } from 'react-native';

import { useSettingsStore } from '@/store/settings.store';
import { gradientToCSS, getWeatherGradient } from '@/utils/weather-theme';

export interface GlassBackgroundProps extends ViewProps {
  className?: string;
  /**
   * 可選傳入 WMO 天氣代碼，依天氣狀況動態調整背景漸層色。
   * 不傳時使用預設中性漸層。
   */
  weatherCode?: number | undefined;
}

/**
 * 頁面漸層背景元件。
 * Web：使用 theme-aware CSS gradient；Native：交由 bg-md-background 呈現。
 * 可選傳入 weatherCode 啟用天氣動態背景色。
 */
export function GlassBackground({
  className = '',
  style,
  children,
  weatherCode,
  ...props
}: GlassBackgroundProps) {
  const theme = useSettingsStore((s) => s.theme);
  const isDark = theme === 'dark';

  const webGradient: ViewStyle =
    Platform.OS === 'web'
      ? ({
          backgroundImage:
            weatherCode !== undefined
              ? gradientToCSS(getWeatherGradient(weatherCode, isDark))
              : `linear-gradient(135deg, var(--color-md-background) 0%, var(--color-md-surface-container) 45%, var(--color-md-background) 100%)`,
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
