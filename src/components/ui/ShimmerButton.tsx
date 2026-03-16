import { forwardRef, useEffect } from 'react';
import { Platform, Pressable, PressableProps, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

export interface ShimmerButtonProps extends Omit<PressableProps, 'accessibilityRole'> {
  children: React.ReactNode;
  /** 閃光顏色，預設 #ffffff */
  shimmerColor?: string;
  /** 閃光持續時間（ms），預設 3000 */
  shimmerDuration?: number;
  /** 圓角，預設 24 */
  borderRadius?: number;
  /** 背景色，預設 rgba(0,0,0,0.9) */
  background?: string;
  className?: string;
  textClassName?: string;
}

/**
 * ShimmerButton — Premium 按鈕，帶邊框閃光效果。
 * Web：CSS conic-gradient 旋轉動畫。
 * Native：reanimated opacity 脈衝 + 邊框高光。
 */
export const ShimmerButton = forwardRef<View, ShimmerButtonProps>(function ShimmerButton(
  {
    children,
    shimmerColor = '#ffffff',
    shimmerDuration = 3000,
    borderRadius = 24,
    background = 'rgba(0,0,0,0.9)',
    className = '',
    textClassName = '',
    disabled,
    ...props
  },
  ref,
) {
  if (Platform.OS === 'web') {
    return (
      <WebShimmerButton
        ref={ref}
        shimmerColor={shimmerColor}
        shimmerDuration={shimmerDuration}
        borderRadius={borderRadius}
        background={background}
        className={className}
        textClassName={textClassName}
        disabled={disabled}
        {...props}
      >
        {children}
      </WebShimmerButton>
    );
  }

  return (
    <NativeShimmerButton
      ref={ref}
      shimmerColor={shimmerColor}
      shimmerDuration={shimmerDuration}
      borderRadius={borderRadius}
      background={background}
      className={className}
      textClassName={textClassName}
      disabled={disabled}
      {...props}
    >
      {children}
    </NativeShimmerButton>
  );
});

/** Web 版：旋轉 conic-gradient */
const WebShimmerButton = forwardRef<View, ShimmerButtonProps>(function WebShimmerButton(
  {
    children,
    shimmerColor,
    shimmerDuration,
    borderRadius,
    background,
    className,
    textClassName,
    disabled,
    ...props
  },
  ref,
) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: shimmerDuration ?? 3000, easing: Easing.linear }),
      -1,
      false,
    );
  }, [shimmerDuration, rotation]);

  const shimmerStyle = useAnimatedStyle(() => ({
    position: 'absolute' as const,
    inset: -2,
    borderRadius: borderRadius ?? 24,
    overflow: 'hidden' as const,
    background: `conic-gradient(from ${rotation.value}deg, transparent 0%, ${shimmerColor} 10%, transparent 20%)`,
  }));

  return (
    <Pressable
      ref={ref}
      accessibilityRole="button"
      disabled={disabled}
      className={`relative overflow-hidden active:scale-95 ${disabled ? 'opacity-50' : ''} ${className}`.trim()}
      style={{ borderRadius }}
      {...props}
    >
      <Animated.View style={shimmerStyle} />
      <View
        style={{
          backgroundColor: background,
          borderRadius: (borderRadius ?? 24) - 2,
          margin: 2,
          paddingHorizontal: 24,
          paddingVertical: 14,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {typeof children === 'string' ? (
          <Text className={`font-semibold text-white ${textClassName}`.trim()}>{children}</Text>
        ) : (
          children
        )}
      </View>
    </Pressable>
  );
});

/** Native 版：邊框 opacity 脈衝 */
const NativeShimmerButton = forwardRef<View, ShimmerButtonProps>(function NativeShimmerButton(
  {
    children,
    shimmerColor,
    shimmerDuration,
    borderRadius,
    background,
    className,
    textClassName,
    disabled,
    ...props
  },
  ref,
) {
  const shimmerOpacity = useSharedValue(0.3);

  useEffect(() => {
    shimmerOpacity.value = withRepeat(
      withTiming(0.8, {
        duration: (shimmerDuration ?? 3000) / 2,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true,
    );
  }, [shimmerDuration, shimmerOpacity]);

  const borderStyle = useAnimatedStyle(() => ({
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: borderRadius ?? 24,
    borderWidth: 1.5,
    borderColor: shimmerColor,
    opacity: shimmerOpacity.value,
  }));

  return (
    <Pressable
      ref={ref}
      accessibilityRole="button"
      disabled={disabled}
      className={`relative overflow-hidden active:scale-95 ${disabled ? 'opacity-50' : ''} ${className}`.trim()}
      style={{
        borderRadius,
        backgroundColor: background,
      }}
      {...props}
    >
      <Animated.View style={borderStyle} pointerEvents="none" />
      <View
        style={{
          paddingHorizontal: 24,
          paddingVertical: 14,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {typeof children === 'string' ? (
          <Text className={`font-semibold text-white ${textClassName}`.trim()}>{children}</Text>
        ) : (
          children
        )}
      </View>
    </Pressable>
  );
});
