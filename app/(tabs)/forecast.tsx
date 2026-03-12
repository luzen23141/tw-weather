import { View } from 'react-native';

import { AnimatedEntry } from '@/components/ui/AnimatedEntry';
import { BlurDecorative } from '@/components/ui/BlurDecorative';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { GlassBackground } from '@/components/ui/GlassBackground';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { PageHeaderCard } from '@/components/ui/PageHeaderCard';
import { PageScrollView } from '@/components/ui/PageScrollView';
import { PageState } from '@/components/ui/PageState';
import { SourceBadge } from '@/components/ui/SourceBadge';
import {
  DailyForecastSkeleton,
  HourlyForecastSkeleton,
  SkeletonBox,
  SkeletonProvider,
} from '@/components/ui/SkeletonLoader';
import { DailyForecastList } from '@/components/weather/DailyForecastList';
import { HourlyForecastList } from '@/components/weather/HourlyForecastList';
import { useEffectiveLocation } from '@/hooks/useEffectiveLocation';
import { useWeather } from '@/hooks/useWeather';
import { getGlassStyle } from '@/utils/glass';
import { formatLocationSecondaryName } from '@/utils/location-display';

function ForecastSkeleton() {
  return (
    <SkeletonProvider>
      <View className="gap-6">
        {/* PageHeaderCard 骨架 */}
        <View
          className="mx-4 rounded-3xl border border-glass-border bg-md-surface-container px-5 py-4 gap-3"
          style={getGlassStyle(20)}
        >
          <View className="flex-row items-center gap-3">
            <SkeletonBox height={40} width={40} borderRadius={20} />
            <View className="flex-1 gap-2">
              <SkeletonBox height={10} width="30%" borderRadius={4} />
              <SkeletonBox height={18} width="60%" borderRadius={5} />
            </View>
          </View>
        </View>
        <HourlyForecastSkeleton />
        <DailyForecastSkeleton />
      </View>
    </SkeletonProvider>
  );
}

export default function ForecastScreen() {
  const {
    effectiveLocation,
    isLoading: locationLoading,
    error: locationError,
  } = useEffectiveLocation();

  const {
    data: weatherData,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useWeather(effectiveLocation);

  const isLoadingCombined = locationLoading || isLoading;
  const errorCombined = locationError || error;

  const locationSecondaryText = effectiveLocation
    ? formatLocationSecondaryName(effectiveLocation)
    : null;

  return (
    <ErrorBoundary
      fallback={
        <GlassBackground className="items-center justify-center">
          <LoadingSpinner label="頁面出錯，請重新整理" />
        </GlassBackground>
      }
    >
      <GlassBackground>
        <PageScrollView
          onRefresh={() => {
            void refetch();
          }}
          refreshing={isRefetching}
        >
          <BlurDecorative color="accent" size="xl" position="top-right" />
          <BlurDecorative color="tertiary" size="md" position="bottom-left" />

          {isLoadingCombined ? (
            <PageState type="loading" skeleton={<ForecastSkeleton />} />
          ) : errorCombined ? (
            <PageState type="error" title="無法取得預報資料" description={errorCombined.message} />
          ) : weatherData && effectiveLocation ? (
            <View className="gap-6">
              <AnimatedEntry delay={0} duration={350}>
                <PageHeaderCard
                  icon="partly-sunny-outline"
                  title={effectiveLocation.name}
                  subtitle={locationSecondaryText}
                  eyebrow="逐時與每日預報"
                  rightSlot={<SourceBadge source={weatherData.source} />}
                />
              </AnimatedEntry>

              <AnimatedEntry delay={80} duration={400}>
                <HourlyForecastList forecasts={weatherData.hourlyForecast} />
              </AnimatedEntry>

              <AnimatedEntry delay={160} duration={400}>
                <DailyForecastList forecasts={weatherData.dailyForecast} />
              </AnimatedEntry>
            </View>
          ) : (
            <PageState
              type="empty"
              title="目前沒有可用預報"
              description="請先選擇地點，或稍後再試一次。"
            />
          )}
        </PageScrollView>
      </GlassBackground>
    </ErrorBoundary>
  );
}
