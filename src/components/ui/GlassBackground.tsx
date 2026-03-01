import { Platform, View, ViewProps, ViewStyle } from 'react-native';

export interface GlassBackgroundProps extends ViewProps {
  className?: string;
}

/**
 * 頁面漸層背景元件。
 * Web：CSS linear-gradient；Native：實色 background。
 */
export function GlassBackground({
  className = '',
  style,
  children,
  ...props
}: GlassBackgroundProps) {
  const webGradient: ViewStyle =
    Platform.OS === 'web'
      ? ({
          backgroundImage: 'linear-gradient(135deg, #e0f2fe 0%, #ede9fe 40%, #f0f4f8 100%)',
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
