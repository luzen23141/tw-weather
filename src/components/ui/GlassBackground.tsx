import { Platform, View, ViewProps, ViewStyle } from 'react-native';

import { DotPattern } from '@/components/ui/DotPattern';
import { Meteors } from '@/components/ui/Meteors';
import { useSettingsStore } from '@/store/settings.store';
import { gradientToCSS, getWeatherGradient } from '@/utils/weather-theme';

export interface GlassBackgroundProps extends ViewProps {
  className?: string;
  /**
   * 可選傳入 WMO 天氣代碼，依天氣狀況動態調整背景漸層色。
   * 不傳時使用預設深藍紫漸層。
   */
  weatherCode?: number | undefined;
  /** 是否顯示流星裝飾，預設 false */
  showMeteors?: boolean;
  /** 是否顯示點陣背景，預設 false */
  showDotPattern?: boolean;
}

/** 深藍紫漸層 — 匹配設計圖風格 */
const DEFAULT_GRADIENT_LIGHT =
  'linear-gradient(160deg, #2a3875 0%, #3a4f8a 25%, #4a5f9a 50%, #5a6faa 75%, #6a7fba 100%)';
const DEFAULT_GRADIENT_DARK =
  'linear-gradient(160deg, #0e1428 0%, #1a2340 30%, #1e2a48 60%, #222f55 100%)';

/**
 * 頁面漸層背景元件。
 * 深藍紫漸層 + 低干擾毛玻璃背景。
 */
export function GlassBackground({
  className = '',
  style,
  children,
  weatherCode,
  showMeteors = false,
  showDotPattern = false,
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
              : isDark
                ? DEFAULT_GRADIENT_DARK
                : DEFAULT_GRADIENT_LIGHT,
        } as ViewStyle)
      : {};

  return (
    <View
      className={`flex-1 bg-md-background ${className}`.trim()}
      style={[webGradient, style]}
      {...props}
    >
      {showDotPattern ? <DotPattern color="rgba(255,255,255,0.08)" gap={24} dotSize={1} /> : null}
      {showMeteors ? <Meteors number={12} /> : null}
      {children}
    </View>
  );
}
