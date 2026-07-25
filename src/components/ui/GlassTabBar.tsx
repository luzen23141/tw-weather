import { Tabs } from 'expo-router';
import React, { useCallback } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon, type AppIconName } from '@/components/icons/AppIcon';
import { getGlassStyle } from '@/components/ui/glass';
import { useTabBarCollapse } from '@/hooks/useTabBarCollapse';

const ACTIVE_COLOR = 'rgba(255, 255, 255, 0.95)';
const INACTIVE_COLOR = 'rgba(255, 255, 255, 0.55)';

const ICON_BY_ROUTE: Record<string, AppIconName> = {
  index: 'partly-sunny-outline',
  history: 'time-outline',
  locations: 'location-outline',
  settings: 'options-outline',
};

/**
 * Liquid Glass 非對稱邊框。
 *
 * 關鍵不是模糊度，是邊框的方向性：上緣最亮、左右次之、下緣最暗，模擬光從上方
 * 打在玻璃厚度上的高光。四邊等亮的邊框看起來會像貼紙，不像有厚度的玻璃。
 */
const GLASS_EDGE = {
  borderTopColor: 'rgba(255, 255, 255, 0.5)',
  borderLeftColor: 'rgba(255, 255, 255, 0.3)',
  borderRightColor: 'rgba(255, 255, 255, 0.3)',
  borderBottomColor: 'rgba(255, 255, 255, 0.14)',
  borderWidth: 1,
} as const;

/** active 項是「玻璃上的透鏡」—— 同材質再疊一層，而非填色按鈕 */
const LENS_EDGE = {
  borderTopColor: 'rgba(255, 255, 255, 0.55)',
  borderBottomColor: 'rgba(255, 255, 255, 0.12)',
  borderLeftColor: 'transparent',
  borderRightColor: 'transparent',
  borderWidth: 1,
} as const;

/**
 * 從 expo-router 的 `Tabs` 反推 tabBar renderer 的參數型別。
 *
 * 這個型別實際來自 `@react-navigation/bottom-tabs`，但那不是本專案的直接依賴
 * （只是 expo-router 的傳遞依賴，pnpm 的嚴格 node_modules 下無法直接 import）。
 * 為了一個 type-only import 多裝一個套件不划算，而且版本要自己跟 expo-router 對齊。
 */
type TabBarRenderer = NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>;
type TabBarProps = Parameters<TabBarRenderer>[0];

export interface GlassTabBarProps extends TabBarProps {
  /** 收合時顯示於 active 圖示旁的文字，通常是當前地點 */
  collapsedLabel?: string | undefined;
}

/**
 * 自繪底部導航欄。
 *
 * 為什麼不用 `Tabs` 的 `tabBarStyle`：Expo Router 的 `Tabs` 不接受 animated
 * style，而收合行為需要把 `Animated.View` 掛在導航欄上。改用 `tabBar` prop
 * 自繪是唯一能同時保有路由狀態與動畫的做法。
 *
 * 收合後仍保留當前地點 —— 這是最新 Safari 底部欄的核心行為：縮小可以，但不能
 * 讓使用者失去「我現在在哪」的身分資訊。
 */
export function GlassTabBar({
  state,
  descriptors,
  navigation,
  collapsedLabel,
}: GlassTabBarProps): React.ReactElement {
  const insets = useSafeAreaInsets();
  const collapsed = useTabBarCollapse();

  /*
    pointerEvents 必須放在 style 而非 prop，且要跟著收合狀態切換。

    兩個原因疊在一起造成過「整條導航列點不動」：
    1. `pointerEvents` 作為 **prop** 已被 react-native-web 棄用 —— 新版只發出
       警告而不套用，等於沒寫。
    2. 收合 pill 疊在展開 pill 的正上方，未收合時它是 opacity 0 的隱形層；
       若它不放行點擊，整條導航列的點擊全部被這個看不見的元素吃掉。

    放進 useAnimatedStyle 讓它跟著 shared value 即時切換 —— 這個值每次收合
    都會變，靜態 style 跟不上。
  */
  const expandedStyle = useAnimatedStyle(() => ({
    opacity: withTiming(collapsed.value ? 0 : 1, { duration: 220 }),
    transform: [{ scale: withTiming(collapsed.value ? 0.88 : 1, { duration: 280 }) }],
    pointerEvents: collapsed.value ? ('none' as const) : ('auto' as const),
  }));

  const collapsedStyle = useAnimatedStyle(() => ({
    opacity: withTiming(collapsed.value ? 1 : 0, { duration: 220 }),
    transform: [{ scale: withTiming(collapsed.value ? 1 : 0.86, { duration: 280 }) }],
    pointerEvents: collapsed.value ? ('auto' as const) : ('none' as const),
  }));

  const onPress = useCallback(
    (routeKey: string, routeName: string, isFocused: boolean) => {
      const event = navigation.emit({
        type: 'tabPress',
        target: routeKey,
        canPreventDefault: true,
      });
      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(routeName);
      }
    },
    [navigation],
  );

  const activeRoute = state.routes[state.index];
  const activeIcon =
    activeRoute !== undefined
      ? (ICON_BY_ROUTE[activeRoute.name] ?? 'cloud-outline')
      : 'cloud-outline';

  const bottom = Math.max(insets.bottom, Platform.OS === 'web' ? 12 : 8);

  return (
    <View style={{ position: 'absolute', left: 0, right: 0, bottom, pointerEvents: 'box-none' }}>
      <Animated.View
        className="self-center flex-row items-center rounded-full bg-white/20 p-1"
        style={[GLASS_EDGE, getGlassStyle(24), expandedStyle]}
      >
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const label = descriptors[route.key]?.options.title ?? route.name;
          const iconName = ICON_BY_ROUTE[route.name] ?? 'cloud-outline';

          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: isFocused }}
              accessibilityLabel={label}
              onPress={() => {
                onPress(route.key, route.name, isFocused);
              }}
              className="h-[38px] w-[46px] items-center justify-center rounded-full"
              style={
                isFocused ? [LENS_EDGE, { backgroundColor: 'rgba(255,255,255,0.3)' }] : undefined
              }
            >
              <AppIcon
                name={iconName}
                size={19}
                color={isFocused ? ACTIVE_COLOR : INACTIVE_COLOR}
              />
            </Pressable>
          );
        })}
      </Animated.View>

      <Animated.View className="absolute inset-x-0 items-center" style={collapsedStyle}>
        <View
          className="flex-row items-center gap-1.5 rounded-full bg-white/20 py-1 pl-1 pr-4"
          style={[GLASS_EDGE, getGlassStyle(24)]}
        >
          <View
            className="h-8 w-[38px] items-center justify-center rounded-full"
            style={[LENS_EDGE, { backgroundColor: 'rgba(255,255,255,0.3)' }]}
          >
            <AppIcon name={activeIcon} size={17} color={ACTIVE_COLOR} />
          </View>
          {collapsedLabel !== undefined ? (
            <Text className="text-[12px] text-md-on-surface">{collapsedLabel}</Text>
          ) : null}
        </View>
      </Animated.View>
    </View>
  );
}
