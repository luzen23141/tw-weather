import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BlurDecorative } from '@/components/ui/BlurDecorative';
import { Button } from '@/components/ui/Button';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { GlassBackground } from '@/components/ui/GlassBackground';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { CurrentWeatherCard } from '@/components/weather/CurrentWeatherCard';
import { DailyForecastList } from '@/components/weather/DailyForecastList';
import { HourlyForecastList } from '@/components/weather/HourlyForecastList';
import { useEffectiveLocation } from '@/hooks/useEffectiveLocation';
import { useWeather } from '@/hooks/useWeather';
import { getGlassStyle } from '@/utils/glass';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    effectiveLocation,
    displayName,
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
        {/* 背景裝飾 Blur */}
        <BlurDecorative color="accent" size="xl" position="top-right" opacity={0.15} />
        <BlurDecorative color="tertiary" size="lg" position="bottom-left" opacity={0.1} />

        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingBottom: insets.bottom + 80,
            paddingTop: 8,
          }}
        >
          <Stack.Screen options={{ headerTitle: displayName }} />

          {isLoading_combined ? (
            <View className="flex-1 items-center justify-center py-32">
              <LoadingSpinner size="lg" label="載入天氣資料..." />
            </View>
          ) : error_combined ? (
            <View className="flex-1 items-center justify-center py-32 px-8">
              <View
                className="bg-md-surface rounded-3xl p-8 items-center gap-4 w-full border border-glass-border"
                style={getGlassStyle(20)}
              >
                <Ionicons name="cloud-offline-outline" size={52} color="#7B8FA0" />
                <Text className="text-md-on-surface text-center text-base font-semibold">
                  無法取得天氣資料
                </Text>
                <Text className="text-md-on-surface-variant text-center text-sm leading-5">
                  {error_combined.message}
                </Text>
                <Button
                  variant="filled"
                  label="前往選擇地點"
                  className="mt-2"
                  onPress={() => router.push('/locations')}
                />
              </View>
            </View>
          ) : weatherData && effectiveLocation ? (
            <View className="gap-6">
              <CurrentWeatherCard
                data={weatherData.current}
                location={effectiveLocation}
                source={weatherData.source}
              />

              <View className="py-1">
                <HourlyForecastList forecasts={weatherData.hourlyForecast} />
              </View>

              <View className="py-1">
                <DailyForecastList forecasts={weatherData.dailyForecast} />
              </View>
            </View>
          ) : (
            <View className="flex-1 items-center justify-center py-32 px-8">
              <View
                className="bg-md-surface rounded-3xl p-8 items-center gap-4 w-full border border-glass-border"
                style={getGlassStyle(20)}
              >
                <Ionicons name="location-outline" size={52} color="var(--color-md-primary)" />
                <Text className="text-md-on-surface text-center text-lg font-bold">
                  選擇你的地點
                </Text>
                <Text className="text-md-on-surface-variant text-center text-sm leading-5">
                  前往地點管理選擇城市，或開啟定位服務自動抓取你的所在位置。
                </Text>
                <Button
                  variant="filled"
                  label="前往選擇地點"
                  className="mt-2"
                  onPress={() => router.push('/locations')}
                />
              </View>
            </View>
          )}
        </ScrollView>
      </GlassBackground>
    </ErrorBoundary>
  );
}
