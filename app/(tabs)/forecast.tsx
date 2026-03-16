import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { BlurFade } from '@/components/ui/BlurFade';
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
import { useWeatherPage } from '@/hooks/useWeatherPage';
import { getWeatherErrorMessage } from '@/utils/error-message';
import { getGlassStyle } from '@/components/ui/glass';

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
  const router = useRouter();
  const {
    effectiveLocation,
    secondaryDisplayName: locationSecondaryText,
    weatherData,
    isLoading: isLoadingCombined,
    locationError,
    weatherError: error,
    isRefetching,
    refetch,
  } = useWeatherPage();

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
          <BlurDecorative color="accent" size="xl" position="top-right" opacity={0.08} />
          <BlurDecorative color="tertiary" size="md" position="bottom-left" opacity={0.06} />

          {isLoadingCombined ? (
            <PageState type="loading" skeleton={<ForecastSkeleton />} />
          ) : !effectiveLocation ? (
            <PageState
              type="empty"
              title="請先選擇地點"
              description={
                locationError
                  ? '目前無法取得你的定位，請先手動選擇地點，再查看逐時與每日預報。'
                  : '前往地點管理選擇城市後，即可查看接下來的逐時與每日預報。'
              }
              actionLabel="前往選擇地點"
              onActionPress={() => router.push('/locations')}
            />
          ) : error ? (
            <PageState
              type="error"
              title="無法取得預報資料"
              description={getWeatherErrorMessage(error)}
              actionLabel="重試"
              onActionPress={() => {
                void refetch();
              }}
            />
          ) : weatherData && effectiveLocation ? (
            <View className="gap-7">
              <BlurFade delay={0} duration={350}>
                <PageHeaderCard
                  icon="partly-sunny-outline"
                  title={effectiveLocation.name}
                  subtitle={locationSecondaryText}
                  eyebrow="逐時與每日預報"
                  rightSlot={<SourceBadge source={weatherData.source} />}
                />
              </BlurFade>

              <BlurFade delay={80} duration={400}>
                <HourlyForecastList forecasts={weatherData.hourlyForecast} />
              </BlurFade>

              <BlurFade delay={160} duration={400}>
                <DailyForecastList forecasts={weatherData.dailyForecast} />
              </BlurFade>
            </View>
          ) : null}
        </PageScrollView>
      </GlassBackground>
    </ErrorBoundary>
  );
}
