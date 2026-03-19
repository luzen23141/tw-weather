import { useRouter, Stack } from 'expo-router';
import { View } from 'react-native';
import type { ReactNode } from 'react';

import { BlurFade } from '@/components/ui/BlurFade';
import { BlurDecorative } from '@/components/ui/BlurDecorative';
import { Button } from '@/components/ui/Button';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { GlassBackground } from '@/components/ui/GlassBackground';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { NoLocationState } from '@/components/ui/NoLocationState';
import { PageScrollView } from '@/components/ui/PageScrollView';
import { PageState } from '@/components/ui/PageState';
import { Ripple } from '@/components/ui/Ripple';
import { WeatherPageSkeleton } from '@/components/ui/SkeletonLoader';
import { CurrentWeatherCard } from '@/components/weather/CurrentWeatherCard';
import { DailyForecastList } from '@/components/weather/DailyForecastList';
import { HourlyForecastList } from '@/components/weather/HourlyForecastList';
import { useWeatherPage } from '@/hooks/useWeatherPage';
import { getWeatherErrorMessage } from '@/utils/error-message';
import { useSettingsStore } from '@/store/settings.store';

export default function HomeScreen() {
  const router = useRouter();
  const {
    effectiveLocation,
    primaryDisplayName,
    weatherData,
    isLoading: isLoadingCombined,
    locationError,
    weatherError: error,
    isRefetching,
    refetch,
  } = useWeatherPage();

  const enabledSources = useSettingsStore((state) => state.enabledSources);

  const weatherCardLocation = effectiveLocation
    ? { ...effectiveLocation, name: primaryDisplayName }
    : null;

  const renderStateWithRipple = (node: ReactNode) => (
    <View className="relative">
      <View className="pointer-events-none absolute left-1/2 top-10 h-[220px] w-[220px] -translate-x-1/2">
        <Ripple count={1} size={220} color="rgba(144, 132, 255, 0.12)" />
      </View>
      {node}
    </View>
  );

  return (
    <ErrorBoundary
      fallback={
        <GlassBackground className="items-center justify-center">
          <LoadingSpinner label="頁面出錯，請重新整理" />
        </GlassBackground>
      }
    >
      <GlassBackground weatherCode={weatherData?.current.weatherCode}>
        <BlurDecorative color="accent" size="xl" position="top-right" opacity={0.08} />
        <BlurDecorative color="tertiary" size="lg" position="bottom-left" opacity={0.06} />

        <PageScrollView
          onRefresh={() => {
            void refetch();
          }}
          refreshing={isRefetching}
        >
          <Stack.Screen options={{ headerTitle: primaryDisplayName }} />

          {isLoadingCombined ? (
            <PageState type="loading" skeleton={<WeatherPageSkeleton />} />
          ) : !weatherCardLocation ? (
            renderStateWithRipple(
              <NoLocationState scope="即時天氣與預報" locationError={locationError} />,
            )
          ) : error ? (
            renderStateWithRipple(
              <PageState
                type="error"
                title="無法取得天氣資料"
                description={getWeatherErrorMessage(error)}
                secondaryActionLabel="重試"
                onSecondaryAction={() => {
                  void refetch();
                }}
                actionLabel="選擇地點"
                onActionPress={() => router.push('/locations')}
              />,
            )
          ) : weatherData && weatherCardLocation ? (
            <View className="gap-7">
              <BlurFade delay={0} duration={400}>
                <CurrentWeatherCard
                  data={weatherData.current}
                  location={weatherCardLocation}
                  source={weatherData.source}
                  enabledSources={enabledSources}
                  actionSlot={
                    <Button
                      variant="tonal"
                      size="sm"
                      label="手動刷新"
                      loading={isRefetching}
                      onPress={() => {
                        void refetch();
                      }}
                    />
                  }
                />
              </BlurFade>

              <BlurFade delay={120} duration={400}>
                <HourlyForecastList forecasts={weatherData.hourlyForecast} />
              </BlurFade>

              <BlurFade delay={200} duration={400}>
                <DailyForecastList forecasts={weatherData.dailyForecast} />
              </BlurFade>
            </View>
          ) : null}
        </PageScrollView>
      </GlassBackground>
    </ErrorBoundary>
  );
}
