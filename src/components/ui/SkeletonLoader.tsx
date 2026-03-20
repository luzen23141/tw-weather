import { createContext, ReactNode, useContext, useEffect } from 'react';
import { DimensionValue, Platform, View, ViewProps } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  SharedValue,
} from 'react-native-reanimated';

import { getGlassStyle } from '@/components/ui/glass';

// ─── 共享動畫 Context ──────────────────────────────────────────────────────────
// 所有骨架屏共用同一個 opacity SharedValue，避免每個 SkeletonBox 獨立建立計時器
const SkeletonOpacityContext = createContext<SharedValue<number> | null>(null);

interface SkeletonProviderProps {
  children: ReactNode;
}

export function SkeletonProvider({ children }: SkeletonProviderProps) {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.9, { duration: 800, easing: Easing.ease }),
        withTiming(0.4, { duration: 800, easing: Easing.ease }),
      ),
      -1,
      false,
    );
  }, [opacity]);

  return (
    <SkeletonOpacityContext.Provider value={opacity}>{children}</SkeletonOpacityContext.Provider>
  );
}

// ─── SkeletonBox ───────────────────────────────────────────────────────────────

export interface SkeletonBoxProps extends ViewProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  className?: string;
}

/** 單一骨架方塊，帶 shimmer 動畫（共享父層動畫值） */
export function SkeletonBox({
  width = '100%',
  height = 16,
  borderRadius = 8,
  className = '',
  style,
  ...props
}: SkeletonBoxProps) {
  const sharedOpacity = useContext(SkeletonOpacityContext);

  // fallback：若無 Provider，建立獨立動畫
  const localOpacity = useSharedValue(0.4);
  useEffect(() => {
    if (sharedOpacity !== null) return;
    localOpacity.value = withRepeat(
      withSequence(
        withTiming(0.9, { duration: 800, easing: Easing.ease }),
        withTiming(0.4, { duration: 800, easing: Easing.ease }),
      ),
      -1,
      false,
    );
  }, [localOpacity, sharedOpacity]);

  const opacityValue = sharedOpacity ?? localOpacity;

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacityValue.value,
  }));

  // Web 端用 CSS shimmer；Native 端用 opacity 脈衝
  const webShimmerClass = Platform.OS === 'web' ? 'web:animate-shimmer' : '';

  return (
    <Animated.View
      className={`bg-md-on-surface/[0.10] ${webShimmerClass} ${className}`.trim()}
      style={[
        {
          width,
          height,
          borderRadius,
        },
        animStyle,
        style,
      ]}
      {...props}
    />
  );
}

function PageHeaderCardSkeleton() {
  return (
    <View
      className="mx-4 gap-3 rounded-3xl border border-white/20 bg-white/14 px-5 py-4"
      style={getGlassStyle(20)}
    >
      <View className="flex-row items-center gap-3">
        <SkeletonBox height={40} width={40} borderRadius={20} />
        <View className="flex-1 gap-2">
          <SkeletonBox height={10} width="30%" borderRadius={4} />
          <SkeletonBox height={18} width="60%" borderRadius={5} />
        </View>
      </View>
      <SkeletonBox height={32} width={100} borderRadius={8} />
    </View>
  );
}

// ─── 複合骨架屏元件 ────────────────────────────────────────────────────────────

/** 當前天氣卡片骨架屏 */
function CurrentWeatherSkeletonInner() {
  return (
    <View
      className="mx-4 gap-6 rounded-[28px] border border-white/20 bg-white/14 px-6 py-6"
      style={getGlassStyle(24)}
    >
      {/* 城市名 */}
      <View className="flex-row items-start justify-between">
        <View className="gap-1.5 flex-1">
          <SkeletonBox height={20} width="55%" borderRadius={6} />
          <SkeletonBox height={12} width="35%" borderRadius={4} />
        </View>
        <SkeletonBox height={22} width={60} borderRadius={11} />
      </View>

      {/* 大溫度 + 圖示 */}
      <View className="items-center gap-3">
        <SkeletonBox height={82} width={120} borderRadius={16} />
        <SkeletonBox height={64} width={64} borderRadius={32} />
        <SkeletonBox height={18} width="40%" borderRadius={6} />
      </View>

      {/* 2x2 Bento Grid */}
      <View className="flex-row flex-wrap gap-3">
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            style={{ width: '48%' }}
            className="gap-2 rounded-3xl border border-white/18 bg-white/10 px-4 py-4"
          >
            <SkeletonBox height={12} width="60%" borderRadius={4} />
            <SkeletonBox height={24} width="45%" borderRadius={6} />
          </View>
        ))}
      </View>

      {/* 最後更新時間 */}
      <SkeletonBox height={12} width="50%" borderRadius={4} className="self-center" />
    </View>
  );
}

/** 逐時預報骨架屏（內部元件，不含 Provider） */
function HourlyForecastSkeletonInner() {
  return (
    <View className="gap-3.5">
      <SkeletonBox height={14} width={60} borderRadius={4} className="mx-4" />
      <View className="flex-row gap-2" style={{ paddingHorizontal: 16 }}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <View
            key={i}
            className="items-center gap-2 rounded-3xl border border-white/18 bg-white/10 px-3 py-3"
            style={{ width: 80 }}
          >
            <SkeletonBox height={11} width={36} borderRadius={4} />
            <SkeletonBox height={40} width={40} borderRadius={20} />
            <SkeletonBox height={16} width={28} borderRadius={4} />
            <SkeletonBox height={11} width={24} borderRadius={4} />
          </View>
        ))}
      </View>
    </View>
  );
}

/** 每日預報骨架屏（內部元件，不含 Provider） */
function DailyForecastSkeletonInner() {
  return (
    <View className="gap-3.5">
      <SkeletonBox height={14} width={48} borderRadius={4} className="mx-4" />
      <View
        className="mx-4 overflow-hidden rounded-3xl border border-white/20 bg-white/8"
        style={getGlassStyle(20)}
      >
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <View
            key={i}
            className={`flex-row items-center gap-3 bg-white/12 px-4 py-4 ${i < 6 ? 'border-b border-white/12' : ''}`}
          >
            <SkeletonBox height={14} width={28} borderRadius={4} />
            <SkeletonBox height={40} width={40} borderRadius={20} />
            <View className="flex-1 gap-2">
              <View className="flex-row justify-between">
                <SkeletonBox height={12} width={28} borderRadius={4} />
                <SkeletonBox height={12} width={28} borderRadius={4} />
              </View>
              <SkeletonBox height={6} width="100%" borderRadius={3} />
            </View>
            <SkeletonBox height={12} width={30} borderRadius={4} />
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── 公開 API（含 Provider 包裝） ─────────────────────────────────────────────

/** 逐時預報骨架屏（含動畫 Provider） */
export function HourlyForecastSkeleton() {
  return (
    <SkeletonProvider>
      <HourlyForecastSkeletonInner />
    </SkeletonProvider>
  );
}

/** 每日預報骨架屏（含動畫 Provider） */
export function DailyForecastSkeleton() {
  return (
    <SkeletonProvider>
      <DailyForecastSkeletonInner />
    </SkeletonProvider>
  );
}

/** 完整天氣頁面骨架屏（含動畫 Provider，所有子元件共享一個動畫值） */
export function WeatherPageSkeleton() {
  return (
    <SkeletonProvider>
      <View className="gap-6">
        <PageHeaderCardSkeleton />

        <CurrentWeatherSkeletonInner />
        <HourlyForecastSkeletonInner />
        <DailyForecastSkeletonInner />
      </View>
    </SkeletonProvider>
  );
}

export { PageHeaderCardSkeleton };
