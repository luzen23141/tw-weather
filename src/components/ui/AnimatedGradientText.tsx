import { ReactNode, useEffect, useMemo } from 'react';
import { Platform, Text, TextProps, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

export interface AnimatedGradientTextProps extends Omit<TextProps, 'className'> {
  children: ReactNode;
  colors?: string[];
  duration?: number;
  className?: string;
}

const DEFAULT_COLORS = ['#5B8DEF', '#9B8FD0', '#5B8DEF'];

export function AnimatedGradientText({
  children,
  colors = DEFAULT_COLORS,
  duration = 3000,
  className = '',
  style,
  ...props
}: AnimatedGradientTextProps) {
  if (Platform.OS === 'web') {
    return (
      <WebGradientText
        colors={colors}
        duration={duration}
        className={className}
        style={style}
        {...props}
      >
        {children}
      </WebGradientText>
    );
  }

  return (
    <NativeGradientText
      colors={colors}
      duration={duration}
      className={className}
      style={style}
      {...props}
    >
      {children}
    </NativeGradientText>
  );
}

function WebGradientText({
  children,
  colors = DEFAULT_COLORS,
  duration = 3000,
  className,
  style,
  ...props
}: AnimatedGradientTextProps) {
  const gradient = useMemo(() => `linear-gradient(90deg, ${colors.join(', ')})`, [colors]);
  const position = useSharedValue(0);

  useEffect(() => {
    position.value = withRepeat(
      withTiming(200, {
        duration,
        easing: Easing.linear,
      }),
      -1,
      false,
    );
  }, [duration, position]);

  const animStyle = useAnimatedStyle(() => ({
    backgroundImage: gradient,
    backgroundSize: '200% 100%',
    backgroundPosition: `${position.value}% 50%`,
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    color: 'transparent',
  }));

  return (
    <Animated.Text className={className ?? ''} style={[animStyle, style]} {...props}>
      {children}
    </Animated.Text>
  );
}

function NativeGradientText({
  children,
  colors = DEFAULT_COLORS,
  duration = 3000,
  className,
  style,
  ...props
}: AnimatedGradientTextProps) {
  const primaryColor = colors[0];
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.6, {
        duration: Math.max(400, duration / 2),
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true,
    );
  }, [duration, opacity]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View style={{ position: 'relative' }}>
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: primaryColor,
          },
          overlayStyle,
        ]}
        pointerEvents="none"
      />
      <Text className={className ?? ''} style={[{ color: primaryColor }, style]} {...props}>
        {children}
      </Text>
    </View>
  );
}
