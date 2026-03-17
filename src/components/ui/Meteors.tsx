import { memo, useEffect, useMemo } from 'react';
import { Dimensions, Platform, StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

export interface MeteorsProps {
  /** 流星數量，預設 20 */
  number?: number;
  /** 最小延遲（ms），預設 0 */
  minDelay?: number;
  /** 最大延遲（ms），預設 5000 */
  maxDelay?: number;
  /** 最小持續時間（ms），預設 2000 */
  minDuration?: number;
  /** 最大持續時間（ms），預設 6000 */
  maxDuration?: number;
  /** 角度（deg），預設 215 */
  angle?: number;
}

interface MeteorData {
  id: number;
  left: number;
  delay: number;
  duration: number;
}

function random(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

/** 單顆流星 */
const Meteor = memo(function Meteor({ data, angle }: { data: MeteorData; angle: number }) {
  const translateY = useSharedValue(-20);
  const opacity = useSharedValue(0);
  const screenHeight = Dimensions.get('window').height;

  useEffect(() => {
    translateY.value = withDelay(
      data.delay,
      withRepeat(
        withSequence(
          withTiming(0, { duration: 0 }),
          withTiming(screenHeight + 200, {
            duration: data.duration,
            easing: Easing.linear,
          }),
        ),
        -1,
        false,
      ),
    );

    opacity.value = withDelay(
      data.delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 100 }),
          withTiming(1, { duration: data.duration - 300 }),
          withTiming(0, { duration: 200 }),
          withTiming(0, { duration: 0 }),
        ),
        -1,
        false,
      ),
    );
  }, [data, translateY, opacity, screenHeight]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { rotate: `${angle - 180}deg` }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: data.left,
          top: -40,
          width: 2,
          height: 20,
        },
        animStyle,
        { pointerEvents: 'none' },
      ]}
    >
      <LinearGradient
        colors={['rgba(255,255,255,0.8)', 'rgba(255,255,255,0)']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
    </Animated.View>
  );
});

/**
 * Meteors — 流星雨背景裝飾。
 * 使用 reanimated 驅動每顆流星的 translateY + opacity 動畫。
 */
export const Meteors = memo(function Meteors({
  number = 20,
  minDelay = 0,
  maxDelay = 5000,
  minDuration = 2000,
  maxDuration = 6000,
  angle = 215,
}: MeteorsProps) {
  const screenWidth =
    Platform.OS === 'web'
      ? typeof window !== 'undefined'
        ? window.innerWidth
        : 400
      : Dimensions.get('window').width;

  const meteors = useMemo<MeteorData[]>(
    () =>
      Array.from({ length: number }, (_, i) => ({
        id: i,
        left: random(0, screenWidth),
        delay: random(minDelay, maxDelay),
        duration: random(minDuration, maxDuration),
      })),
    [number, screenWidth, minDelay, maxDelay, minDuration, maxDuration],
  );

  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}>
      {meteors.map((m) => (
        <Meteor key={m.id} data={m} angle={angle} />
      ))}
    </View>
  );
});
