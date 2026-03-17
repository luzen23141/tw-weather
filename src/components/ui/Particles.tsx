import { memo, useEffect, useMemo } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

interface ParticleData {
  id: number;
  startX: number;
  startY: number;
  driftX: number;
  driftY: number;
  durationX: number;
  durationY: number;
  delay: number;
  pulseDuration: number;
  pulseMin: number;
}

export interface ParticlesProps {
  quantity?: number;
  size?: number;
  color?: string;
  opacity?: number;
  speed?: number;
  className?: string;
}

const windowDimensions = Dimensions.get('window');

const generateParticles = (quantity: number, speed: number, opacity: number): ParticleData[] => {
  const baseDuration = Math.max(1, 12000 / Math.max(speed, 0.1));

  return Array.from({ length: quantity }, (_, index) => {
    const driftRange = 10 + Math.random() * 20;
    const pulseDuration = 1800 + Math.random() * 2200;
    const pulseMin = Math.max(opacity * 0.2, 0.05);

    return {
      id: index,
      startX: Math.random() * windowDimensions.width,
      startY: Math.random() * windowDimensions.height,
      driftX: (Math.random() * 2 - 1) * driftRange,
      driftY: (Math.random() * 2 - 1) * driftRange,
      durationX: baseDuration + Math.random() * 2000,
      durationY: baseDuration + Math.random() * 2000,
      delay: Math.random() * 2000,
      pulseDuration,
      pulseMin,
    };
  });
};

interface ParticleDotProps {
  data: ParticleData;
  size: number;
  color: string;
  opacity: number;
}

const ParticleDot = memo<ParticleDotProps>(({ data, size, color, opacity }) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const pulse = useSharedValue(opacity);

  useEffect(() => {
    translateX.value = withDelay(
      data.delay,
      withRepeat(
        withSequence(
          withTiming(data.driftX, {
            duration: data.durationX,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(-data.driftX, {
            duration: data.durationX,
            easing: Easing.inOut(Easing.ease),
          }),
        ),
        -1,
        true,
      ),
    );

    translateY.value = withDelay(
      data.delay,
      withRepeat(
        withSequence(
          withTiming(data.driftY, {
            duration: data.durationY,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(-data.driftY, {
            duration: data.durationY,
            easing: Easing.inOut(Easing.ease),
          }),
        ),
        -1,
        true,
      ),
    );

    pulse.value = withDelay(
      data.delay,
      withRepeat(
        withSequence(
          withTiming(data.pulseMin, {
            duration: data.pulseDuration,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(opacity, {
            duration: data.pulseDuration,
            easing: Easing.inOut(Easing.ease),
          }),
        ),
        -1,
        true,
      ),
    );
  }, [data, opacity, pulse, translateX, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: data.startX + translateX.value },
      { translateY: data.startY + translateY.value },
    ],
    opacity: pulse.value,
  }));

  return (
    <Animated.View
      key={`${data.id}`}
      style={[
        styles.particle,
        animatedStyle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
      ]}
    />
  );
});

ParticleDot.displayName = 'ParticleDot';

const Particles = memo<ParticlesProps>(
  ({ quantity = 50, size = 2, color = '#ffffff', opacity = 0.3, speed = 0.5, className = '' }) => {
    const particles = useMemo(
      () => generateParticles(quantity, speed, opacity),
      [quantity, size, speed, opacity],
    );

    return (
      <View
        testID="particles"
        className={className}
        style={[styles.container, { pointerEvents: 'none' }]}
      >
        {particles.map((data) => (
          <ParticleDot key={data.id} data={data} size={size} color={color} opacity={opacity} />
        ))}
      </View>
    );
  },
);

export { Particles };

Particles.displayName = 'Particles';

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    position: 'absolute',
  },
  particle: {
    position: 'absolute',
    opacity: 0,
  },
});

// Named export above — no default export
