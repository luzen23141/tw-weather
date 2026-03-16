import { ReactNode, useEffect } from 'react';
import { Platform, ViewProps } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';

type Direction = 'up' | 'down' | 'left' | 'right';

export interface BlurFadeProps extends ViewProps {
  children: ReactNode;
  /** 延遲毫秒數，用於 stagger 效果 */
  delay?: number;
  /** 動畫持續時間，預設 400ms */
  duration?: number;
  /** 初始位移（px），預設 16 */
  offset?: number;
  /** 進場方向，預設 up */
  direction?: Direction;
  /** 初始模糊程度（px），僅 Web 有效，預設 6 */
  blur?: number;
  className?: string;
}

function getTranslateFromDirection(direction: Direction, offset: number) {
  switch (direction) {
    case 'up':
      return { translateY: offset };
    case 'down':
      return { translateY: -offset };
    case 'left':
      return { translateX: offset };
    case 'right':
      return { translateX: -offset };
  }
}

/**
 * BlurFade 進場動畫元件。
 * Web：opacity + translate + blur filter 動畫。
 * Native：opacity + translate 動畫（RN 不支援 animated blur filter）。
 */
export function BlurFade({
  children,
  delay = 0,
  duration = 400,
  offset = 16,
  direction = 'up',
  blur = 6,
  className = '',
  style,
  ...props
}: BlurFadeProps) {
  const opacity = useSharedValue(0);
  const translate = useSharedValue(getTranslateFromDirection(direction, offset));
  const blurValue = useSharedValue(blur);

  useEffect(() => {
    const cfg = { duration, easing: Easing.out(Easing.quad) };
    opacity.value = withDelay(delay, withTiming(1, cfg));
    translate.value = withDelay(
      delay,
      withTiming(
        direction === 'up' || direction === 'down' ? { translateY: 0 } : { translateX: 0 },
        cfg,
      ),
    );
    blurValue.value = withDelay(delay, withTiming(0, cfg));
  }, [delay, duration, direction, opacity, translate, blurValue]);

  const animStyle = useAnimatedStyle(() => {
    const t = translate.value;
    const transform =
      'translateY' in t ? [{ translateY: t.translateY }] : [{ translateX: t.translateX }];

    const base: Record<string, unknown> = {
      opacity: opacity.value,
      transform,
    };

    if (Platform.OS === 'web') {
      // Web 支援 filter blur 動畫
      (base as Record<string, unknown>).filter = `blur(${blurValue.value}px)`;
    }

    return base;
  });

  return (
    <Animated.View className={className} style={[animStyle, style]} {...props}>
      {children}
    </Animated.View>
  );
}
