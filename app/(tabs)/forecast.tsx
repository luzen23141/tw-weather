import { Ionicons } from '@expo/vector-icons';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BlurDecorative } from '@/components/ui/BlurDecorative';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { GlassBackground } from '@/components/ui/GlassBackground';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { SourceBadge } from '@/components/ui/SourceBadge';
import { DailyForecastList } from '@/components/weather/DailyForecastList';
import { HourlyForecastList } from '@/components/weather/HourlyForecastList';
import { useEffectiveLocation } from '@/hooks/useEffectiveLocation';
import { useWeather } from '@/hooks/useWeather';
import { useSettingsStore } from '@/store/settings.store';

export default function ForecastScreen() {
  const insets = useSafeAreaInsets();
  const { displayMode } = useSettingsStore();
  const {
    effectiveLocation,
    isLoading: locationLoading,
    error: locationError,
  } = useEffectiveLocation();

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
            <View className="gap-5">
              <View className="mx-4 mt-1 rounded-3xl border border-glass-border bg-md-surface/80 px-5 py-5 shadow-glass">
                <View className="flex-row items-start gap-3">
                  <View className="mt-0.5 h-11 w-11 items-center justify-center rounded-2xl bg-md-primary/12 border border-glass-border">
                    <Ionicons
                      name="partly-sunny-outline"
                      size={20}
                      color="var(--color-md-primary)"
                    />
                  </View>
                  <View className="flex-1 gap-1.5">
                    <View className="flex-row items-start justify-between gap-3">
                      <View className="flex-1">
                        <Text className="text-lg font-bold text-md-on-surface">
                          {effectiveLocation.name}
                        </Text>
                        {effectiveLocation.city && (
                          <Text className="mt-1 text-sm leading-5 text-md-on-surface-variant">
                            {effectiveLocation.city}
                            {effectiveLocation.district && ` · ${effectiveLocation.district}`}
                          </Text>
                        )}
                      </View>
                      <SourceBadge
                        source={displayMode === 'aggregate' ? 'aggregate' : weatherData.source}
                      />
                    </View>
                    <Text className="text-xs font-bold uppercase tracking-[1.6px] text-md-primary">
                      逐時與每日預報
                    </Text>
                  </View>
                </View>
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
