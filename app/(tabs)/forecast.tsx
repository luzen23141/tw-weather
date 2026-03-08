import { View } from 'react-native';

import { BlurDecorative } from '@/components/ui/BlurDecorative';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { GlassBackground } from '@/components/ui/GlassBackground';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { PageHeaderCard } from '@/components/ui/PageHeaderCard';
import { PageScrollView } from '@/components/ui/PageScrollView';
import { PageState } from '@/components/ui/PageState';
import { SourceBadge } from '@/components/ui/SourceBadge';
import { DailyForecastList } from '@/components/weather/DailyForecastList';
import { HourlyForecastList } from '@/components/weather/HourlyForecastList';
import { useEffectiveLocation } from '@/hooks/useEffectiveLocation';
import { useWeather } from '@/hooks/useWeather';
import { useSettingsStore } from '@/store/settings.store';
import { formatLocationSecondaryName } from '@/utils/location-display';

export default function ForecastScreen() {
  const locationDisplayFormat = useSettingsStore((state) => state.locationDisplayFormat);
  const {
    effectiveLocation,
    isLoading: locationLoading,
    error: locationError,
  } = useEffectiveLocation();

  const { data: weatherData, isLoading, error } = useWeather(effectiveLocation);

  const isLoadingCombined = locationLoading || isLoading;
  const errorCombined = locationError || error;

  const locationSecondaryText = effectiveLocation
    ? formatLocationSecondaryName(effectiveLocation, locationDisplayFormat)
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
        <PageScrollView>
          <BlurDecorative color="accent" size="xl" position="top-right" />
          <BlurDecorative color="tertiary" size="md" position="bottom-left" />

          {isLoadingCombined ? (
            <PageState type="loading" title="載入預報資料" description="正在取得逐時與每日預報。" />
          ) : errorCombined ? (
            <PageState
              type="error"
              title="無法取得預報資料"
              description={errorCombined.message}
            />
          ) : weatherData && effectiveLocation ? (
            <View className="gap-6">
              <PageHeaderCard
                icon="partly-sunny-outline"
                title={effectiveLocation.name}
                subtitle={locationSecondaryText}
                eyebrow="逐時與每日預報"
                rightSlot={<SourceBadge source={weatherData.source} />}
              />

              <HourlyForecastList forecasts={weatherData.hourlyForecast} />
              <DailyForecastList forecasts={weatherData.dailyForecast} />
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
