import { ReactNode, useEffect } from 'react';
import { ViewProps } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';

export interface AnimatedEntryProps extends ViewProps {
  children: ReactNode;
  /** 延遲毫秒數，用於 stagger 效果 */
  delay?: number;
  /** 動畫持續時間，預設 400ms */
  duration?: number;
  /** 初始垂直位移（px），預設 16 */
  translateY?: number;
  className?: string;
}

/**
 * 進場淡入 + 上滑動畫包裝元件。
 * 可用 delay 做 stagger 錯開效果。
 */
export function AnimatedEntry({
  children,
  delay = 0,
  duration = 400,
  translateY = 16,
  className = '',
  style,
  ...props
}: AnimatedEntryProps) {
  const opacity = useSharedValue(0);
  const translateYValue = useSharedValue(translateY);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration, easing: Easing.out(Easing.quad) }));
    translateYValue.value = withDelay(
      delay,
      withTiming(0, { duration, easing: Easing.out(Easing.quad) }),
    );
  }, [delay, duration, opacity, translateY, translateYValue]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateYValue.value }],
  }));

  return (
    <Animated.View className={className} style={[animStyle, style]} {...props}>
      {children}
    </Animated.View>
  );
}
