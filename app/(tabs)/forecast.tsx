import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BlurDecorative } from '@/components/ui/BlurDecorative';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { GlassBackground } from '@/components/ui/GlassBackground';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { SourceBadge } from '@/components/ui/SourceBadge';
import { DailyForecastList } from '@/components/weather/DailyForecastList';
import { HourlyForecastList } from '@/components/weather/HourlyForecastList';
import { useLocation } from '@/hooks/useLocation';
import { useWeather } from '@/hooks/useWeather';
import { useLocationsStore } from '@/store/locations.store';
import { useSettingsStore } from '@/store/settings.store';

export default function ForecastScreen() {
  const insets = useSafeAreaInsets();
  const { location, isLoading: locationLoading, error: locationError } = useLocation();
  const { displayMode } = useSettingsStore();
  const selectedLocation = useLocationsStore((state) => state.selectedLocation);

  const effectiveLocation = selectedLocation || location;
  const { data: weatherData, isLoading, error } = useWeather(effectiveLocation);

  const isLoading_combined = locationLoading || isLoading;
  const error_combined = locationError || error;

  return (
    <ErrorBoundary
      fallback={
        <GlassBackground className="items-center justify-center">
          <LoadingSpinner label="頁面出錯，請重新整理" />
        </GlassBackground>
      }
    >
      <GlassBackground>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingBottom: insets.bottom + 80,
            paddingTop: 8,
          }}
        >
          <BlurDecorative color="accent" size="xl" position="top-right" />
          <BlurDecorative color="tertiary" size="md" position="bottom-left" />

          {isLoading_combined ? (
            <View className="flex-1 items-center justify-center py-32">
              <LoadingSpinner size="lg" label="載入中..." />
            </View>
          ) : error_combined ? (
            <View className="flex-1 items-center justify-center py-32">
              <Text className="text-md-on-surface-variant text-sm">{error_combined.message}</Text>
            </View>
          ) : weatherData && effectiveLocation ? (
            <View className="gap-4">
              {/* 頂部：城市名稱 + 資料源 badge */}
              <View className="px-4 pt-2 flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-base font-bold text-md-on-surface">
                    {effectiveLocation.name}
                  </Text>
                  {effectiveLocation.city && (
                    <Text className="text-xs text-md-on-surface-variant mt-0.5">
                      {effectiveLocation.city}
                      {effectiveLocation.district && ` · ${effectiveLocation.district}`}
                    </Text>
                  )}
                </View>
                <SourceBadge
                  source={displayMode === 'aggregate' ? 'aggregate' : weatherData.source}
                />
              </View>

              <HourlyForecastList forecasts={weatherData.hourlyForecast} />
              <DailyForecastList forecasts={weatherData.dailyForecast} />
            </View>
          ) : null}
        </ScrollView>
      </GlassBackground>
    </ErrorBoundary>
  );
}
