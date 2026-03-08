import { ScrollView, ScrollViewProps, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface PageScrollViewProps extends ScrollViewProps {
  topPadding?: number;
  bottomOffset?: number;
}

export function PageScrollView({
  children,
  contentContainerStyle,
  topPadding = 12,
  bottomOffset = 104,
  ...props
}: PageScrollViewProps) {
  const insets = useSafeAreaInsets();

  const baseContentStyle: ViewStyle = {
    paddingTop: topPadding,
    paddingBottom: insets.bottom + bottomOffset,
  };

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={[baseContentStyle, contentContainerStyle]}
      {...props}
    >
      {children}
    </ScrollView>
  );
}
