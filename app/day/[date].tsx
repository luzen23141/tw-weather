import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { View } from 'react-native';

import { BlurFade } from '@/components/ui/BlurFade';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { GlassBackground } from '@/components/ui/GlassBackground';
import { PageErrorFallback } from '@/components/ui/PageErrorFallback';
import { PAGE_ENTER } from '@/components/ui/page-motion';
import { PageScrollView } from '@/components/ui/PageScrollView';
import { PageState } from '@/components/ui/PageState';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { SkeletonBox, SkeletonProvider } from '@/components/ui/SkeletonLoader';
import { DayDetailCard } from '@/components/weather/DayDetailCard';
import { HourlyForecastList } from '@/components/weather/HourlyForecastList';
import { useWeatherPage } from '@/hooks/useWeatherPage';
import { dayDetailFromForecast } from '@/utils/day-detail';
import { getWeatherErrorMessage } from '@/utils/error-message';

/** 以本地日期比較，避免 UTC 位移把時段算到隔天 */
function isSameLocalDate(iso: string, date: string): boolean {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  const local = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;
  return local === date;
}

function offsetFromToday(date: string): number {
  const target = new Date(`${date}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

/**
 * 單日詳情（未來方向）。
 *
 * 從首頁每日預報列的任一天下鑽而來。詳情天生帶「哪一天」這個參數，因此走路由
 * 而非分頁 —— 分頁沒有參數概念，使用者從分頁進來還得再選一次日期。
 *
 * 與歷史頁共用 `DayDetailCard`；差別只在資料來源是預報而非觀測。
 */
export default function DayDetailScreen() {
  const router = useRouter();
  const { date } = useLocalSearchParams<{ date: string }>();
  const { weatherData, isLoading, weatherError, isRefetching, refetch } = useWeatherPage();

  const day = useMemo(
    () => weatherData?.dailyForecast.find((d) => d.date === date),
    [weatherData, date],
  );

  // 該日的逐時區段。預報通常只涵蓋前幾天，較遠的日期不會有逐時資料。
  const dayHours = useMemo(
    () => (weatherData?.hourlyForecast ?? []).filter((h) => isSameLocalDate(h.timestamp, date)),
    [weatherData, date],
  );

  return (
    <ErrorBoundary fallback={<PageErrorFallback />}>
      <GlassBackground weatherCode={day?.weatherCode}>
        <PageScrollView
          // 透明標題列疊在內容上方，需要額外的頂部間距讓第一個區塊避開它
          topPadding={56}
          onRefresh={() => {
            void refetch();
          }}
          refreshing={isRefetching}
        >
          {isLoading ? (
            <PageState
              type="loading"
              skeleton={
                <SkeletonProvider>
                  <View className="gap-5">
                    <SkeletonBox height={196} borderRadius={22} className="mx-4" />
                    <SkeletonBox height={120} borderRadius={18} className="mx-4" />
                  </View>
                </SkeletonProvider>
              }
            />
          ) : weatherError ? (
            <PageState
              type="error"
              title="無法取得預報資料"
              description={getWeatherErrorMessage(weatherError)}
              actionLabel="重試"
              onActionPress={() => {
                void refetch();
              }}
            />
          ) : day === undefined ? (
            <PageState
              type="empty"
              title="查無該日預報"
              description="這一天不在目前的預報範圍內。"
              actionLabel="回到天氣"
              onActionPress={() => router.back()}
            />
          ) : (
            <View className="gap-5">
              <BlurFade delay={PAGE_ENTER.firstDelay} duration={PAGE_ENTER.duration}>
                <DayDetailCard
                  detail={dayDetailFromForecast(day)}
                  offsetDays={offsetFromToday(day.date)}
                />
              </BlurFade>

              {dayHours.length > 0 ? (
                <BlurFade delay={PAGE_ENTER.staggerDelay} duration={PAGE_ENTER.secondaryDuration}>
                  <HourlyForecastList forecasts={dayHours} />
                </BlurFade>
              ) : (
                <View className="gap-2">
                  <SectionLabel>逐時預報</SectionLabel>
                  <View className="mx-4 items-center rounded-[18px] border border-white/20 bg-white/12 p-4">
                    <PageState
                      type="empty"
                      title="無逐時資料"
                      description="逐時預報僅涵蓋較近的幾天。"
                    />
                  </View>
                </View>
              )}
            </View>
          )}
        </PageScrollView>
      </GlassBackground>
    </ErrorBoundary>
  );
}
