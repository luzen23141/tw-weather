import { MouseEvent, ReactNode, useCallback, useEffect, useMemo } from 'react';
import { Platform, View, ViewStyle, NativeSyntheticEvent } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

import { getGlassStyle } from '@/components/ui/glass';

export interface MagicCardProps {
  children: ReactNode;
  gradientColor?: string;
  gradientSize?: number;
  className?: string;
  style?: ViewStyle;
}

const AnimatedView = Animated.View;

export function MagicCard({
  children,
  gradientColor = 'rgba(91, 141, 239, 0.15)',
  gradientSize = 200,
  className = '',
  style,
}: MagicCardProps) {
  const glassStyle = useMemo(() => getGlassStyle(28), []);

  const pulseOpacity = useSharedValue(0.2);
  const pulseScale = useSharedValue(0.9);

  const pointerX = useSharedValue(gradientSize / 2);
  const pointerY = useSharedValue(gradientSize / 2);
  const pointerOpacity = useSharedValue(0);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    pulseOpacity.value = withRepeat(
      withTiming(0.6, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    pulseScale.value = withRepeat(
      withTiming(1.08, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [pulseOpacity, pulseScale]);

  const handleMouseMove = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      const { clientX, clientY, currentTarget } = event;
      const rect = currentTarget.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
      const y = Math.max(0, Math.min(rect.height, clientY - rect.top));
      pointerX.value = withTiming(x, { duration: 140, easing: Easing.out(Easing.exp) });
      pointerY.value = withTiming(y, { duration: 140, easing: Easing.out(Easing.exp) });
      pointerOpacity.value = withTiming(1, { duration: 220, easing: Easing.out(Easing.ease) });
    },
    [pointerX, pointerY, pointerOpacity],
  );

  const handleMouseLeave = useCallback(() => {
    pointerOpacity.value = withTiming(0, { duration: 400, easing: Easing.out(Easing.ease) });
  }, [pointerOpacity]);

  const webOverlayStyle = useAnimatedStyle(() => {
    return {
      opacity: pointerOpacity.value,
      backgroundImage: `radial-gradient(circle ${gradientSize}px at ${pointerX.value}px ${pointerY.value}px, ${gradientColor} 0%, transparent 65%)`,
    };
  });

  const nativeOverlayStyle = useAnimatedStyle(() => {
    return {
      opacity: pulseOpacity.value,
      transform: [{ scale: pulseScale.value }],
    };
  });

  const baseStyle: ViewStyle = {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    overflow: 'hidden',
  };

  const mouseHandlers =
    Platform.OS === 'web'
      ? {
          onMouseMove: handleMouseMove as unknown as (event: NativeSyntheticEvent<unknown>) => void,
          onMouseLeave: handleMouseLeave as unknown as (
            event: NativeSyntheticEvent<unknown>,
          ) => void,
        }
      : undefined;

  return (
    <View
      style={[glassStyle, baseStyle, style]}
      className={`relative border border-white/25 bg-white/5 shadow-lg shadow-white/10 backdrop-blur-xl ${className}`.trim()}
      {...(mouseHandlers ?? {})}
    >
      {Platform.OS === 'web' ? (
        <AnimatedView
          style={[
            {
              position: 'absolute',
              inset: 0,
              borderRadius: 24,
              pointerEvents: 'none',
            },
            webOverlayStyle,
          ]}
        />
      ) : (
        <AnimatedView
          style={[
            {
              position: 'absolute',
              inset: 0,
              borderRadius: 24,
              pointerEvents: 'none',
              backgroundColor: gradientColor,
            },
            nativeOverlayStyle,
          ]}
        />
      )}
      {children}
    </View>
  );
}
