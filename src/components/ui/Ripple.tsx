import { memo, useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  SharedValue,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

export interface RippleProps {
  count?: number;
  color?: string;
  duration?: number;
  size?: number;
  className?: string;
}

const RippleCircle = memo(
  ({
    phase,
    progress,
    size,
    color,
  }: {
    phase: number;
    progress: SharedValue<number>;
    size: number;
    color: string;
  }) => {
    const animatedStyle = useAnimatedStyle(() => {
      const offset = (progress.value + phase) % 1;
      const scale = 0.3 + offset * 1.5;
      const opacity = 1 - offset;
      return {
        opacity,
        transform: [{ scale }],
      };
    });

    return (
      <Animated.View
        pointerEvents="none"
        style={[
          styles.circle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
          },
          animatedStyle,
        ]}
      />
    );
  },
);

const RippleComponent = ({
  count = 3,
  color = 'rgba(91, 141, 239, 0.3)',
  duration = 3000,
  size = 200,
  className,
}: RippleProps) => {
  const progress = useSharedValue(0);
  const actualCount = Math.max(1, count);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, {
        duration,
        easing: Easing.out(Easing.ease),
      }),
      -1,
    );
  }, [duration, progress]);

  const phases = useMemo(
    () => Array.from({ length: actualCount }, (_, index) => index / actualCount),
    [actualCount],
  );

  return (
    <View pointerEvents="none" {...(className ? { className } : {})} style={styles.wrapper}>
      {phases.map((phase) => (
        <RippleCircle key={phase} phase={phase} progress={progress} size={size} color={color} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    inset: 0,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  circle: {
    position: 'absolute',
  },
});

export const Ripple = memo(RippleComponent);
