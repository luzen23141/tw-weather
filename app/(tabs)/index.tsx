import { useRouter } from 'expo-router';
import { useMemo, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { AppIcon } from '@/components/icons/AppIcon';
import { BlurFade } from '@/components/ui/BlurFade';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { GlassBackground } from '@/components/ui/GlassBackground';
import { NoLocationState } from '@/components/ui/NoLocationState';
import { PageErrorFallback } from '@/components/ui/PageErrorFallback';
import { PAGE_ENTER } from '@/components/ui/page-motion';
import { PageScrollView } from '@/components/ui/PageScrollView';
import { PageState } from '@/components/ui/PageState';
import { Ripple } from '@/components/ui/Ripple';
import { WeatherPageSkeleton } from '@/components/ui/SkeletonLoader';
import { getPressFeedbackStyle } from '@/components/ui/press-feedback';
import { CurrentWeatherCard } from '@/components/weather/CurrentWeatherCard';
import { DailyTrendList } from '@/components/weather/DailyTrendList';
import { HourlyForecastList } from '@/components/weather/HourlyForecastList';
import { RainSummaryNote } from '@/components/weather/RainSummaryNote';
import { SourceRow } from '@/components/weather/SourceRow';
import { StaleDataNote } from '@/components/weather/StaleDataNote';
import { useHistory } from '@/hooks/useHistory';
import { useWeatherPage } from '@/hooks/useWeatherPage';
import { getWeatherErrorMessage } from '@/utils/error-message';
import { findNowIndex, hourWindow } from '@/utils/hourly';
import { buildRainSummary } from '@/utils/rain-summary';
import { todayApparentHigh } from '@/utils/today-summary';
import { useSettingsStore } from '@/store/settings.store';

/** 首頁逐時窗口：過去 2 小時 + 未來 12 小時。更遠的從 /hourly 看。 */
const HOME_PAST_HOURS = 2;
const HOME_FUTURE_HOURS = 12;

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

  // 只為了「昨日」那一列，取一天就夠
  const { data: history } = useHistory(effectiveLocation, 1);

  const weatherCardLocation = effectiveLocation
    ? { ...effectiveLocation, name: primaryDisplayName }
    : null;

  const hourly = weatherData?.hourlyForecast ?? [];
  const daily = weatherData?.dailyForecast ?? [];
  const today = daily[0];
  // history 由 useHistory 依日期新到舊排序，第一筆即昨日
  const yesterday = history?.[0];

  const rainSummary = useMemo(() => buildRainSummary(hourly), [hourly]);
  // 當前時段的逐時資料，用來補 current 端點缺的降雨機率
  const currentHour = useMemo(() => hourly[findNowIndex(hourly)], [hourly]);
  // 首頁只顯示過去 2h + 未來 12h 的精簡窗口，完整 168h 從 /hourly 看
  const hourlyWindow = useMemo(
    () => hourWindow(hourly, HOME_PAST_HOURS, HOME_FUTURE_HOURS),
    [hourly],
  );
  const apparentHigh = useMemo(() => todayApparentHigh(hourly), [hourly]);

  const renderStateWithRipple = (node: ReactNode) => (
    <View className="relative">
      <View className="pointer-events-none absolute left-1/2 top-10 h-[220px] w-[220px] -translate-x-1/2">
        <Ripple count={1} size={220} color="rgba(144, 132, 255, 0.12)" />
      </View>
      {node}
    </View>
  );

  return (
    <ErrorBoundary fallback={<PageErrorFallback />}>
      <GlassBackground weatherCode={weatherData?.current.weatherCode}>
        <PageScrollView
          onRefresh={() => {
            void refetch();
          }}
          refreshing={isRefetching}
        >
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
            <View className="gap-5">
              <BlurFade delay={PAGE_ENTER.firstDelay} duration={PAGE_ENTER.duration}>
                <CurrentWeatherCard
                  data={weatherData.current}
                  location={weatherCardLocation}
                  {...(today !== undefined
                    ? { todayHigh: today.temperatureMax, todayLow: today.temperatureMin }
                    : {})}
                  {...(yesterday !== undefined ? { yesterdayHigh: yesterday.temperatureMax } : {})}
                  {...(apparentHigh !== undefined ? { apparentHigh } : {})}
                  currentHour={currentHour}
                  actionSlot={
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="手動刷新"
                      accessibilityState={{ busy: isRefetching, disabled: isRefetching }}
                      className="h-[30px] w-[30px] items-center justify-center rounded-full border border-white/[0.22]"
                      disabled={isRefetching}
                      onPress={() => {
                        void refetch();
                      }}
                      style={(state) =>
                        getPressFeedbackStyle(state, {
                          disabled: isRefetching,
                          pressedOpacity: 0.84,
                          pressedScale: 0.97,
                        })
                      }
                    >
                      <AppIcon name="refresh-outline" size={14} color="rgba(255,255,255,0.92)" />
                    </Pressable>
                  }
                />

                <View className="mx-4">
                  <SourceRow
                    source={weatherData.source}
                    readings={weatherData.sourceReadings}
                    enabledSources={enabledSources}
                    timestamp={weatherData.current.timestamp}
                  />
                  <StaleDataNote fetchedAt={weatherData.fetchedAt} isRefetching={isRefetching} />
                  {rainSummary !== null ? <RainSummaryNote summary={rainSummary} /> : null}
                </View>
              </BlurFade>

              <BlurFade delay={PAGE_ENTER.staggerDelay} duration={PAGE_ENTER.secondaryDuration}>
                <HourlyForecastList
                  forecasts={hourlyWindow}
                  totalCount={hourly.length}
                  onSeeAll={() => router.push('/hourly')}
                />
              </BlurFade>

              <BlurFade delay={PAGE_ENTER.staggerDelay} duration={PAGE_ENTER.secondaryDuration}>
                <DailyTrendList
                  forecasts={daily}
                  history={history}
                  currentTemperature={weatherData.current.temperature}
                  onSelectDay={(date) => router.push(`/day/${date}`)}
                  onSelectPastDay={() => router.push('/history')}
                />
              </BlurFade>
            </View>
          ) : null}
        </PageScrollView>
      </GlassBackground>
    </ErrorBoundary>
  );
}
