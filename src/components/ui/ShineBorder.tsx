import { ReactNode, useEffect } from 'react';
import { Platform, View, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

export interface ShineBorderProps {
  children: ReactNode;
  borderWidth?: number;
  duration?: number;
  color?: string[];
  borderRadius?: number;
  className?: string;
}

const DEFAULT_COLORS = ['#5B8DEF', '#9B8FD0', '#5B8DEF'];

export function ShineBorder({
  children,
  borderWidth = 1.5,
  duration = 4000,
  color = DEFAULT_COLORS,
  borderRadius = 24,
  className = '',
}: ShineBorderProps) {
  if (Platform.OS === 'web') {
    return (
      <WebShineBorder
        borderWidth={borderWidth}
        duration={duration}
        color={color}
        borderRadius={borderRadius}
        className={className}
      >
        {children}
      </WebShineBorder>
    );
  }

  return (
    <NativeShineBorder
      borderWidth={borderWidth}
      duration={duration}
      color={color}
      borderRadius={borderRadius}
      className={className}
    >
      {children}
    </NativeShineBorder>
  );
}

type SharedProps = {
  children: ReactNode;
  borderWidth: number;
  duration: number;
  color: string[];
  borderRadius: number;
  className: string;
};

function WebShineBorder({
  borderWidth,
  duration,
  color,
  borderRadius,
  className,
  children,
}: SharedProps) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, {
        duration,
        easing: Easing.linear,
      }),
      -1,
    );
  }, [duration, rotation]);

  const gradientStyle = useAnimatedStyle(() => ({
    position: 'absolute' as const,
    inset: 0,
    borderRadius,
    background: `conic-gradient(${color.join(', ')})`,
    transform: [{ rotate: `${rotation.value}deg` }],
    pointerEvents: 'none' as const,
    mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
    WebkitMaskComposite: 'xor',
    maskComposite: 'exclude',
    padding: borderWidth,
  }));

  const containerStyle: StyleProp<ViewStyle> = {
    borderRadius,
    padding: borderWidth,
    overflow: 'hidden',
    position: 'relative',
  };

  const contentStyle: StyleProp<ViewStyle> = {
    borderRadius: Math.max(0, borderRadius - borderWidth),
    overflow: 'hidden',
  };

  return (
    <View style={containerStyle} className={className}>
      <Animated.View style={gradientStyle} />
      <View style={contentStyle}>{children}</View>
    </View>
  );
}

function NativeShineBorder({
  borderWidth,
  duration,
  color,
  borderRadius,
  className,
  children,
}: SharedProps) {
  const glow = useSharedValue(1);

  useEffect(() => {
    glow.value = withRepeat(
      withTiming(0.3, {
        duration: duration / 2,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true,
    );
  }, [duration, glow]);

  const animatedStyle = useAnimatedStyle(() => ({
    borderRadius,
    borderWidth,
    borderColor: color[0],
    opacity: glow.value,
  }));

  const containerStyle: StyleProp<ViewStyle> = {
    borderRadius,
    padding: borderWidth,
    overflow: 'hidden',
  };

  return (
    <Animated.View style={animatedStyle} className={className}>
      <View style={containerStyle}>{children}</View>
    </Animated.View>
  );
}
