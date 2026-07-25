import { LinearGradient } from 'expo-linear-gradient';
// 經 expo-router 取用而非直接依賴 @react-navigation/native —— 後者只是傳遞依賴，
// pnpm 嚴格 node_modules 下無法直接 import
import { useIsFocused } from 'expo-router';
import { Platform, useColorScheme, View, ViewProps, ViewStyle } from 'react-native';

import { gradientToCSS, getWeatherGradient } from '@/utils/weather-theme';

export interface GlassBackgroundProps extends ViewProps {
  className?: string;
  /**
   * 可選傳入 WMO 天氣代碼，依天氣狀況動態調整背景漸層色。
   * 不傳時使用預設的多雲漸層。
   */
  weatherCode?: number | undefined;
}

/** 未指定天氣代碼時的預設值（多雲），讓兩個平台走同一條取色路徑 */
const DEFAULT_WEATHER_CODE = 3;

/**
 * 頁面漸層背景。
 *
 * ## 為什麼原生要用 LinearGradient
 *
 * 先前只有 Web 會渲染漸層（CSS `backgroundImage`），原生分支落回單一底色 ——
 * 也就是 **iOS 上整套玻璃設計是失效的**，半透明玻璃疊在純色上完全看不出層次。
 * iOS 是主要平台之一，這個落差不能留著。
 *
 * ## 深色模式
 *
 * `weather-theme.ts` 一直都有完整的 DARK_GRADIENTS，但先前寫死 `isDark = false`，
 * 那組配色沒有任何路徑能啟用。改為跟隨系統設定 —— iOS 使用者預期 app 跟著
 * 系統深淺色走，而這裡的前景本來就是白字，兩種底色都成立。
 */
export function GlassBackground({
  className = '',
  style,
  children,
  weatherCode,
  ...props
}: GlassBackgroundProps) {
  const isDark = useColorScheme() === 'dark';
  const isFocused = useIsFocused();
  const colors = getWeatherGradient(weatherCode ?? DEFAULT_WEATHER_CODE, isDark);

  /*
    Web 上非當前分頁的 scene 必須自己藏。

    react-native-screens 在 Web 預設停用（強制啟用會讓整個版面塌縮 —— 它的
    web 容器不帶尺寸，這正是它自我停用的原因）。停用時 @react-navigation 的
    MaybeScreen 退化成純 View，**沒有任何隱藏機制**：所有分頁同時掛在 DOM、
    同時可見、同時攔截點擊，而 zIndex 恰好把當前頁壓在最下面。

    症狀是「切過分頁後，畫面顯示舊分頁、所有點擊都沒反應」。

    display:none 而非 unmount：保留 React 狀態（捲動位置、表單暫態），
    同時把元素從渲染、hit-testing 與無障礙樹一併移除。
    每個分頁畫面都以 GlassBackground 為根，所以修在這裡一次涵蓋全部。
  */
  const webHiddenStyle: ViewStyle | null =
    Platform.OS === 'web' && !isFocused ? { display: 'none' } : null;

  if (Platform.OS === 'web') {
    const webGradient = {
      backgroundImage: gradientToCSS(colors, 160),
    } as ViewStyle;

    return (
      <View
        className={`flex-1 bg-md-background ${className}`.trim()}
        style={[webGradient, webHiddenStyle, style]}
        {...props}
      >
        {children}
      </View>
    );
  }

  return (
    <LinearGradient
      // start/end 的對角走向對應 Web 的 160deg，讓兩平台的視覺一致
      colors={colors}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={[{ flex: 1 }, style]}
      {...props}
    >
      {children}
    </LinearGradient>
  );
}
