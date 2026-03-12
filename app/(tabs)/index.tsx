import { useRouter, Stack } from 'expo-router';
import { View } from 'react-native';

import { AnimatedEntry } from '@/components/ui/AnimatedEntry';
import { BlurDecorative } from '@/components/ui/BlurDecorative';
import { Button } from '@/components/ui/Button';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { GlassBackground } from '@/components/ui/GlassBackground';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { PageHeaderCard } from '@/components/ui/PageHeaderCard';
import { PageScrollView } from '@/components/ui/PageScrollView';
import { PageState } from '@/components/ui/PageState';
import { SourceBadge } from '@/components/ui/SourceBadge';
import { WeatherPageSkeleton } from '@/components/ui/SkeletonLoader';
import { CurrentWeatherCard } from '@/components/weather/CurrentWeatherCard';
import { DailyForecastList } from '@/components/weather/DailyForecastList';
import { HourlyForecastList } from '@/components/weather/HourlyForecastList';
import { useEffectiveLocation } from '@/hooks/useEffectiveLocation';
import { useWeather } from '@/hooks/useWeather';
import { formatLocationDisplayName } from '@/utils/location-display';

export default function HomeScreen() {
  const router = useRouter();
  const {
    effectiveLocation,
    displayName,
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
  const townshipDisplayName = effectiveLocation
    ? formatLocationDisplayName(effectiveLocation)
    : displayName;
  const weatherCardLocation = effectiveLocation
    ? { ...effectiveLocation, name: townshipDisplayName }
    : null;

  return (
    <ErrorBoundary
      fallback={
        <GlassBackground className="items-center justify-center">
          <LoadingSpinner label="頁面出錯，請重新整理" />
        </GlassBackground>
      }
    >
      <GlassBackground weatherCode={weatherData?.current.weatherCode}>
        <BlurDecorative color="accent" size="xl" position="top-right" opacity={0.15} />
        <BlurDecorative color="tertiary" size="lg" position="bottom-left" opacity={0.1} />

        <PageScrollView
          onRefresh={() => {
            void refetch();
          }}
          refreshing={isRefetching}
        >
          <Stack.Screen options={{ headerTitle: townshipDisplayName }} />

          {isLoadingCombined ? (
            <PageState type="loading" skeleton={<WeatherPageSkeleton />} />
          ) : errorCombined ? (
            <PageState
              type="error"
              title="無法取得天氣資料"
              description={
                errorCombined.message.includes('PROXY_URL')
                  ? '應用程式設定錯誤，請聯繫開發者。'
                  : errorCombined.message.includes('401') || errorCombined.message.includes('403')
                    ? '認證失敗，請稍後再試。'
                    : errorCombined.message.includes('502') || errorCombined.message.includes('504')
                      ? '天氣資料來源暫時無法連線，請稍後再試或切換資料來源。'
                      : errorCombined.message.includes('地點未定義')
                        ? '尚未選擇地點，請先選擇你想查看的城市。'
                        : '暫時無法取得資料，請稍後再試。'
              }
              secondaryActionLabel="重試"
              onSecondaryAction={() => {
                void refetch();
              }}
              actionLabel="選擇地點"
              onActionPress={() => router.push('/locations')}
            />
          ) : weatherData && weatherCardLocation ? (
            <View className="gap-6">
              <AnimatedEntry delay={0} duration={350}>
                <PageHeaderCard
                  icon="partly-sunny-outline"
                  title={weatherCardLocation.name}
                  eyebrow="即時天氣與預報"
                  rightSlot={<SourceBadge source={weatherData.source} />}
                  bottomSlot={
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
              </AnimatedEntry>

              <AnimatedEntry delay={80} duration={400}>
                <CurrentWeatherCard
                  data={weatherData.current}
                  location={weatherCardLocation}
                  source={weatherData.source}
                />
              </AnimatedEntry>

              <AnimatedEntry delay={160} duration={400}>
                <HourlyForecastList forecasts={weatherData.hourlyForecast} />
              </AnimatedEntry>

              <AnimatedEntry delay={240} duration={400}>
                <DailyForecastList forecasts={weatherData.dailyForecast} />
              </AnimatedEntry>
            </View>
          ) : (
            <PageState
              type="empty"
              title="選擇你的地點"
              description="前往地點管理選擇城市，或開啟定位服務自動抓取所在位置。"
              actionLabel="前往選擇地點"
              onActionPress={() => router.push('/locations')}
            />
          )}
        </PageScrollView>
      </GlassBackground>
    </ErrorBoundary>
  );
}
