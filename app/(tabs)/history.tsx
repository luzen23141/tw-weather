import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';

import { BlurFade } from '@/components/ui/BlurFade';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { GlassBackground } from '@/components/ui/GlassBackground';
import { NoLocationState } from '@/components/ui/NoLocationState';
import { PageErrorFallback } from '@/components/ui/PageErrorFallback';
import { PAGE_ENTER } from '@/components/ui/page-motion';
import { PageScrollView } from '@/components/ui/PageScrollView';
import { PageState } from '@/components/ui/PageState';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { SkeletonBox, SkeletonProvider } from '@/components/ui/SkeletonLoader';
import { DayDetailCard } from '@/components/weather/DayDetailCard';
import { DayStrip } from '@/components/weather/DayStrip';
import { useHistory } from '@/hooks/useHistory';
import { useWeatherPage } from '@/hooks/useWeatherPage';
import { dayOffsetFromToday } from '@/utils/date';
import { dayDetailFromForecast, dayDetailFromHistory } from '@/utils/day-detail';
import { buildDayTimeline } from '@/utils/day-timeline';
import { getWeatherErrorMessage } from '@/utils/error-message';

function HistorySkeleton() {
  return (
    <SkeletonProvider>
      <View className="gap-5">
        <SkeletonBox height={196} borderRadius={22} className="mx-4" />
        <SkeletonBox height={86} borderRadius={18} className="mx-4" />
      </View>
    </SkeletonProvider>
  );
}

/*
 * 只往回顯示幾天的觀測。
 *
 * 資料層與後端最多支援 92 天（見 useHistory / MAX_HISTORY_RANGE_DAYS），但過去
 * 只取最近兩天 —— 使用者要的是「跟前一兩天比冷了還熱了」，更久遠的觀測對日常
 * 決策沒有幫助。未來則接上完整的每日預報。
 */
const HISTORY_DISPLAY_DAYS = 2;

/**
 * 日期時間軸。
 *
 * 一條連續的時間線：過去幾天的實際觀測 + 今日與未來的預報。使用者往右滑就能
 * 看到未來，不必為此換一個畫面。選中的日期是觀測還是預報，決定詳情卡的呈現
 * （共用 DayDetailCard，只換 renderer）。
 *
 * 職責仍是**「找到那一天並呈現那一天」** —— 與首頁每日列的下鑽（/day/[date]）
 * 互補：這裡是可掃視的時間軸，那裡是單日的直接連結。
 */
export default function HistoryScreen() {
  const router = useRouter();
  const {
    effectiveLocation,
    weatherData,
    isLoading: pageLoading,
    locationError,
    weatherError,
  } = useWeatherPage();
  const [selectedDate, setSelectedDate] = useState('');

  const {
    data: historyData,
    isLoading: historyLoading,
    error: historyError,
    refetch,
    isRefetching,
  } = useHistory(effectiveLocation ?? null, HISTORY_DISPLAY_DAYS);

  // 過去觀測 + 未來預報，合併成一條由舊到新的時間軸
  const timeline = useMemo(
    () => buildDayTimeline(historyData ?? [], weatherData?.dailyForecast ?? []),
    [historyData, weatherData],
  );

  const stripDays = useMemo(
    () =>
      timeline.map((d) => ({
        date: d.date,
        weatherCode: d.weatherCode,
        tempMax: d.tempMax,
        tempMin: d.tempMin,
      })),
    [timeline],
  );

  const selected = useMemo(
    () => timeline.find((d) => d.date === selectedDate) ?? null,
    [timeline, selectedDate],
  );

  const isLoadingCombined = pageLoading || (!!effectiveLocation && historyLoading);
  // 預報可用即足以呈現；歷史失敗只是少了過去幾天，不該擋住整頁
  const blockingError = weatherError ?? (timeline.length === 0 ? historyError : null);

  /*
    預設落在「今天」；今天不在時間軸上時，退回**最接近**今天的那一天。

    兩個先前的錯誤：
    1. 用 `toISOString().slice(0, 10)` 取今天 —— 那是 UTC 日期。台北時間
       00:00~08:00 之間 UTC 還停在前一天，於是清晨開啟時「今天」永遠找不到。
    2. 找不到時退回 `timeline[length - 1]`，那是**最遠**的未來日（一週後），
       與註解宣稱的「最接近」正好相反。CWA 當日晚間就不再提供今日預報，
       今天缺席不是邊角案例，所以使用者實際看到的預設就是一週後那天。

    timeline 已按日期升序，第一個 offset >= 0 的項目就是今天或最近的未來日；
    全部都在過去時取最後一項（也就是最近的一天）。
  */
  useEffect(() => {
    if (timeline.length === 0) return;
    const stillPresent = timeline.some((d) => d.date === selectedDate);
    if (stillPresent) return;

    const nearestFromToday =
      timeline.find((d) => (dayOffsetFromToday(d.date) ?? -Infinity) >= 0) ??
      timeline[timeline.length - 1];
    setSelectedDate(nearestFromToday?.date ?? '');
  }, [timeline, selectedDate]);

  const detail = useMemo(() => {
    if (selected === null) return null;
    if (selected.isObservation && selected.history !== undefined) {
      return dayDetailFromHistory(selected.history);
    }
    if (selected.forecast !== undefined) {
      return dayDetailFromForecast(selected.forecast);
    }
    return null;
  }, [selected]);

  const offsetDays = useMemo(() => {
    if (selectedDate === '') return undefined;
    const target = new Date(`${selectedDate}T00:00:00`).getTime();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.round((target - today.getTime()) / 86_400_000);
  }, [selectedDate]);

  return (
    <ErrorBoundary fallback={<PageErrorFallback />}>
      {/* 背景漸層跟著所選日期的天氣走，切換日期時整個畫面的氛圍也跟著變 */}
      <GlassBackground weatherCode={selected?.weatherCode}>
        <PageScrollView
          onRefresh={() => {
            void refetch();
          }}
          refreshing={isRefetching}
        >
          {isLoadingCombined ? (
            <PageState type="loading" skeleton={<HistorySkeleton />} />
          ) : !effectiveLocation ? (
            <NoLocationState scope="歷史與預報" locationError={locationError} />
          ) : blockingError ? (
            <PageState
              type="error"
              title="無法取得資料"
              description={getWeatherErrorMessage(blockingError)}
              secondaryActionLabel="前往選擇地點"
              onSecondaryAction={() => router.push('/locations')}
              actionLabel="重試"
              onActionPress={() => {
                void refetch();
              }}
            />
          ) : detail !== null ? (
            <View className="gap-5">
              <BlurFade
                key={selectedDate}
                delay={PAGE_ENTER.firstDelay}
                duration={PAGE_ENTER.duration}
              >
                <DayDetailCard
                  detail={detail}
                  {...(offsetDays !== undefined ? { offsetDays } : {})}
                />
              </BlurFade>

              <BlurFade delay={PAGE_ENTER.staggerDelay} duration={PAGE_ENTER.secondaryDuration}>
                <View className="gap-2">
                  <SectionLabel>選擇日期</SectionLabel>
                  <DayStrip
                    days={stripDays}
                    selectedDate={selectedDate}
                    onSelect={setSelectedDate}
                  />
                </View>
              </BlurFade>
            </View>
          ) : (
            <PageState
              type="empty"
              title="無可用資料"
              description="目前地點尚未有可用的天氣紀錄或預報。"
            />
          )}
        </PageScrollView>
      </GlassBackground>
    </ErrorBoundary>
  );
}
