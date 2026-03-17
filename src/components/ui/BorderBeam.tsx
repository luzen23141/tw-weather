import { useEffect } from 'react';
import { LayoutChangeEvent, Platform, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';

export interface BorderBeamProps {
  /** 光點尺寸，預設 100 */
  size?: number;
  /** 動畫一圈持續時間（ms），預設 3000 */
  duration?: number;
  /** 延遲（ms），預設 0 */
  delay?: number;
  /** 漸層起始色 */
  colorFrom?: string;
  /** 漸層結束色 */
  colorTo?: string;
  /** 邊框寬度，預設 2 */
  borderWidth?: number;
  /** 是否反向 */
  reverse?: boolean;
  className?: string;
}

/**
 * BorderBeam — 卡片邊框光束效果。
 * Web：CSS offset-path 動畫。
 * Native：reanimated 手動計算光點沿矩形邊框位移。
 */
export function BorderBeam({
  size = 100,
  duration = 3000,
  delay: delayMs = 0,
  colorFrom = '#ffaa40',
  colorTo = '#9c40ff',
  borderWidth = 2,
  reverse = false,
  className = '',
}: BorderBeamProps) {
  if (Platform.OS === 'web') {
    return (
      <WebBorderBeam
        size={size}
        duration={duration}
        delay={delayMs}
        colorFrom={colorFrom}
        colorTo={colorTo}
        borderWidth={borderWidth}
        reverse={reverse}
        className={className}
      />
    );
  }

  return (
    <NativeBorderBeam
      size={size}
      duration={duration}
      delay={delayMs}
      colorFrom={colorFrom}
      colorTo={colorTo}
      borderWidth={borderWidth}
      reverse={reverse}
    />
  );
}

/** Web 版：CSS offset-path 動畫 */
function WebBorderBeam({
  size,
  duration,
  delay: delayMs,
  colorFrom,
  colorTo,
  borderWidth,
  reverse,
  className,
}: Required<Omit<BorderBeamProps, 'className'>> & { className: string }) {
  const progress = useSharedValue(reverse ? 100 : 0);

  useEffect(() => {
    progress.value = withDelay(
      delayMs,
      withRepeat(
        withTiming(reverse ? 0 : 100, {
          duration,
          easing: Easing.linear,
        }),
        -1,
        false,
      ),
    );
  }, [duration, delayMs, reverse, progress]);

  const animStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    inset: 0,
    overflow: 'hidden',
    borderRadius: 'inherit' as unknown as number,
    pointerEvents: 'none' as const,
  }));

  const beamStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    width: size,
    height: size,
    offsetPath: `rect(0 auto auto 0 round ${size}px)`,
    offsetDistance: `${progress.value}%`,
    background: `linear-gradient(to left, ${colorFrom}, ${colorTo}, transparent)`,
    // mask 讓光點只在邊框區域可見
    mask: `linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)`,
    maskComposite: 'exclude',
    padding: borderWidth,
  }));

  return (
    <Animated.View className={className} style={animStyle}>
      <Animated.View style={beamStyle} />
    </Animated.View>
  );
}

/** Native 版：手動計算光點沿矩形邊框移動 */
function NativeBorderBeam({
  size,
  duration,
  delay: delayMs,
  colorFrom,
  colorTo,
  borderWidth,
  reverse,
}: Required<Omit<BorderBeamProps, 'className'>>) {
  const progress = useSharedValue(reverse ? 1 : 0);
  const containerWidth = useSharedValue(0);
  const containerHeight = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delayMs,
      withRepeat(
        withTiming(reverse ? 0 : 1, {
          duration,
          easing: Easing.linear,
        }),
        -1,
        false,
      ),
    );
  }, [duration, delayMs, reverse, progress]);

  const onLayout = (e: LayoutChangeEvent) => {
    containerWidth.value = e.nativeEvent.layout.width;
    containerHeight.value = e.nativeEvent.layout.height;
  };

  const beamStyle = useAnimatedStyle(() => {
    const w = containerWidth.value;
    const h = containerHeight.value;
    if (w === 0 || h === 0) return { opacity: 0 };

    const perimeter = 2 * (w + h);
    const dist = progress.value * perimeter;

    let x: number;
    let y: number;

    if (dist < w) {
      // Top edge: left → right
      x = dist;
      y = 0;
    } else if (dist < w + h) {
      // Right edge: top → bottom
      x = w;
      y = dist - w;
    } else if (dist < 2 * w + h) {
      // Bottom edge: right → left
      x = w - (dist - w - h);
      y = h;
    } else {
      // Left edge: bottom → top
      x = 0;
      y = h - (dist - 2 * w - h);
    }

    return {
      position: 'absolute' as const,
      width: size / 2,
      height: size / 2,
      borderRadius: size / 4,
      left: x - size / 4,
      top: y - size / 4,
      backgroundColor: colorFrom,
      opacity: 0.8,
      shadowColor: colorTo,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.6,
      shadowRadius: size / 4,
    };
  });

  return (
    <View
      style={{
        position: 'absolute',
        top: -borderWidth,
        left: -borderWidth,
        right: -borderWidth,
        bottom: -borderWidth,
        overflow: 'hidden',
        borderRadius: 24,
        pointerEvents: 'none',
      }}
      onLayout={onLayout}
    >
      <Animated.View style={beamStyle} />
    </View>
  );
}
