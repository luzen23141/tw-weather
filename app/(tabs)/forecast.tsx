import { View } from 'react-native';

import { BlurFade } from '@/components/ui/BlurFade';
import { BlurDecorative } from '@/components/ui/BlurDecorative';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { GlassBackground } from '@/components/ui/GlassBackground';
import { NoLocationState } from '@/components/ui/NoLocationState';
import { PageErrorFallback } from '@/components/ui/PageErrorFallback';
import { PageHeaderCard } from '@/components/ui/PageHeaderCard';
import { PAGE_ENTER } from '@/components/ui/page-motion';
import { PageScrollView } from '@/components/ui/PageScrollView';
import { PageState } from '@/components/ui/PageState';
import { SourceBadge } from '@/components/ui/SourceBadge';
import {
  DailyForecastSkeleton,
  PageHeaderCardSkeleton,
  SkeletonProvider,
} from '@/components/ui/SkeletonLoader';
import { DailyForecastList } from '@/components/weather/DailyForecastList';
import { useWeatherPage } from '@/hooks/useWeatherPage';
import { getWeatherErrorMessage } from '@/utils/error-message';

function ForecastSkeleton() {
  return (
    <SkeletonProvider>
      <View className="gap-6">
        <PageHeaderCardSkeleton />
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
    <ErrorBoundary fallback={<PageErrorFallback />}>
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
              <BlurFade delay={PAGE_ENTER.firstDelay} duration={PAGE_ENTER.duration}>
                <PageHeaderCard
                  icon="partly-sunny-outline"
                  title={effectiveLocation.name}
                  subtitle={locationSecondaryText}
                  eyebrow="未來 7 天"
                  rightSlot={<SourceBadge source={weatherData.source} />}
                />
              </BlurFade>

              <BlurFade delay={PAGE_ENTER.staggerDelay} duration={PAGE_ENTER.secondaryDuration}>
                <DailyForecastList forecasts={weatherData.dailyForecast} />
              </BlurFade>
            </View>
          ) : null}
        </PageScrollView>
      </GlassBackground>
    </ErrorBoundary>
  );
}
