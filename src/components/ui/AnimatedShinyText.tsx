import { ReactNode, useEffect } from 'react';
import { Platform, Text, TextProps, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

export interface AnimatedShinyTextProps extends Omit<TextProps, 'className'> {
  children: ReactNode;
  /** 閃光寬度（px），預設 100 */
  shimmerWidth?: number;
  className?: string;
}

/**
 * AnimatedShinyText — 文字閃光效果。
 * Web：CSS background-clip + animated background-position。
 * Native：opacity 脈衝降級效果。
 */
export function AnimatedShinyText({
  children,
  shimmerWidth = 100,
  className = '',
  style,
  ...props
}: AnimatedShinyTextProps) {
  if (Platform.OS === 'web') {
    return (
      <WebShinyText shimmerWidth={shimmerWidth} className={className} style={style} {...props}>
        {children}
      </WebShinyText>
    );
  }

  return (
    <NativeShinyText className={className} style={style} {...props}>
      {children}
    </NativeShinyText>
  );
}

/** Web 版：CSS background-clip text + animated background-position */
function WebShinyText({
  children,
  shimmerWidth,
  className,
  style,
  ...props
}: AnimatedShinyTextProps) {
  const sw = shimmerWidth ?? 100;
  const position = useSharedValue(-sw);

  useEffect(() => {
    position.value = withRepeat(
      withTiming(100 + sw, {
        duration: 3000,
        easing: Easing.bezier(0.36, 0.45, 0.63, 0.53),
      }),
      -1,
      false,
    );
  }, [shimmerWidth, position]);

  const animStyle = useAnimatedStyle(() => ({
    backgroundImage: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.8) ${position.value}%, transparent ${position.value + sw}%)`,
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    color: 'transparent',
    backgroundSize: '200% 100%',
  }));

  return (
    <Animated.Text className={className ?? ''} style={[animStyle, style]} {...props}>
      {children}
    </Animated.Text>
  );
}

/** Native 版：opacity 脈衝降級效果 */
function NativeShinyText({
  children,
  className,
  style,
  ...props
}: Omit<AnimatedShinyTextProps, 'shimmerWidth'>) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.6, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [opacity]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View>
      <Text className={className ?? ''} style={style} {...props}>
        {children}
      </Text>
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          },
          animStyle,
        ]}
        pointerEvents="none"
      />
    </View>
  );
}
