import { Platform, View, ViewProps, ViewStyle } from 'react-native';

export interface GlassBackgroundProps extends ViewProps {
  className?: string;
}

/**
 * 頁面漸層背景元件。
 * Web：使用 theme-aware CSS gradient；Native：交由 bg-md-background 呈現。
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
          backgroundImage:
            'linear-gradient(135deg, var(--color-md-background) 0%, var(--color-md-surface-container) 45%, var(--color-md-background) 100%)',
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
