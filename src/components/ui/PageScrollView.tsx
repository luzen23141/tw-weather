import { Platform, RefreshControl, ScrollViewProps, ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useMDColors } from '@/hooks/useMDColors';
import { useCollapsingScrollHandler } from '@/hooks/useTabBarCollapse';

export interface PageScrollViewProps extends ScrollViewProps {
  topPadding?: number;
  bottomOffset?: number;
  maxWidth?: number;
  /** 下拉刷新回調；傳入後自動顯示 RefreshControl */
  onRefresh?: () => void;
  /** 是否正在刷新中 */
  refreshing?: boolean;
  /**
   * 是否讓捲動驅動底部導航欄收合。預設開啟。
   * 內容短到不需要捲動的頁面可關閉，省下 handler 的開銷。
   */
  drivesTabBar?: boolean;
}

export function PageScrollView({
  children,
  contentContainerStyle,
  topPadding = 12,
  bottomOffset = 104,
  maxWidth = 720,
  onRefresh,
  refreshing = false,
  drivesTabBar = true,
  ...props
}: PageScrollViewProps) {
  const insets = useSafeAreaInsets();
  const colors = useMDColors();
  const scrollHandler = useCollapsingScrollHandler();

  const baseContentStyle: ViewStyle = {
    paddingTop: insets.top + topPadding,
    paddingBottom: insets.bottom + bottomOffset,
    ...(Platform.OS === 'web'
      ? {
          alignSelf: 'center',
          maxWidth,
          width: '100%',
        }
      : {}),
  };

  return (
    <Animated.ScrollView
      className="flex-1"
      contentContainerStyle={[baseContentStyle, contentContainerStyle]}
      onScroll={drivesTabBar ? scrollHandler : undefined}
      scrollEventThrottle={16}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
            progressBackgroundColor="rgba(255,255,255,0.12)"
          />
        ) : undefined
      }
      {...props}
    >
      {children}
    </Animated.ScrollView>
  );
}
