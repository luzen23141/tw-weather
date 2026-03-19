import { View } from 'react-native';

import { BlurFade } from '@/components/ui/BlurFade';
import { BlurDecorative } from '@/components/ui/BlurDecorative';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { GlassBackground } from '@/components/ui/GlassBackground';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { NoLocationState } from '@/components/ui/NoLocationState';
import { PageHeaderCard } from '@/components/ui/PageHeaderCard';
import { PageScrollView } from '@/components/ui/PageScrollView';
import { PageState } from '@/components/ui/PageState';
import { SourceBadge } from '@/components/ui/SourceBadge';
import {
  DailyForecastSkeleton,
  HourlyForecastSkeleton,
  PageHeaderCardSkeleton,
  SkeletonProvider,
} from '@/components/ui/SkeletonLoader';
import { DailyForecastList } from '@/components/weather/DailyForecastList';
import { HourlyForecastList } from '@/components/weather/HourlyForecastList';
import { useWeatherPage } from '@/hooks/useWeatherPage';
import { getWeatherErrorMessage } from '@/utils/error-message';

function ForecastSkeleton() {
  return (
    <SkeletonProvider>
      <View className="gap-6">
        <PageHeaderCardSkeleton />
        <HourlyForecastSkeleton />
        <DailyForecastSkeleton />
      </View>
    </SkeletonProvider>
  );
}

export default function ForecastScreen() {
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
            <NoLocationState scope="逐時與每日預報" locationError={locationError} />
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
