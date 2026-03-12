import { RefreshControl, ScrollView, ScrollViewProps, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useMDColors } from '@/hooks/useMDColors';

export interface PageScrollViewProps extends ScrollViewProps {
  topPadding?: number;
  bottomOffset?: number;
  /** 下拉刷新回調；傳入後自動顯示 RefreshControl */
  onRefresh?: () => void;
  /** 是否正在刷新中 */
  refreshing?: boolean;
}

export function PageScrollView({
  children,
  contentContainerStyle,
  topPadding = 12,
  bottomOffset = 104,
  onRefresh,
  refreshing = false,
  ...props
}: PageScrollViewProps) {
  const insets = useSafeAreaInsets();
  const colors = useMDColors();

  const baseContentStyle: ViewStyle = {
    paddingTop: topPadding,
    paddingBottom: insets.bottom + bottomOffset,
  };

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={[baseContentStyle, contentContainerStyle]}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        ) : undefined
      }
      {...props}
    >
      {children}
    </ScrollView>
  );
}
