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
import { HourlyDetailList } from '@/components/weather/HourlyDetailList';
import { useWeatherPage } from '@/hooks/useWeatherPage';
import { getWeatherErrorMessage } from '@/utils/error-message';

/**
 * 完整逐時預報。
 *
 * 從首頁的逐時區塊下鑽而來。首頁只能橫向呈現有限欄位，這裡改成垂直依日分段，
 * 每列多帶體感、風速與降水量。**顯示筆數完全由後端決定** —— 不做任何截斷。
 */
export default function HourlyScreen() {
  const { primaryDisplayName, weatherData, isLoading, weatherError, isRefetching, refetch } =
    useWeatherPage();

  const hourly = weatherData?.hourlyForecast ?? [];

  return (
    <ErrorBoundary fallback={<PageErrorFallback />}>
      <GlassBackground weatherCode={weatherData?.current.weatherCode}>
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
                  <View className="gap-3">
                    <SkeletonBox height={320} borderRadius={18} className="mx-4" />
                  </View>
                </SkeletonProvider>
              }
            />
          ) : weatherError ? (
            <PageState
              type="error"
              title="無法取得逐時預報"
              description={getWeatherErrorMessage(weatherError)}
              actionLabel="重試"
              onActionPress={() => {
                void refetch();
              }}
            />
          ) : hourly.length === 0 ? (
            <PageState
              type="empty"
              title="無逐時預報資料"
              description="目前地點尚未有可用的逐時預報。"
            />
          ) : (
            <BlurFade delay={PAGE_ENTER.firstDelay} duration={PAGE_ENTER.duration}>
              <View className="gap-2">
                <SectionLabel>{`${primaryDisplayName} · 共 ${hourly.length} 小時`}</SectionLabel>
                <HourlyDetailList forecasts={hourly} />
              </View>
            </BlurFade>
          )}
        </PageScrollView>
      </GlassBackground>
    </ErrorBoundary>
  );
}
