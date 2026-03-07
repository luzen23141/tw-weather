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
import { formatLocationDisplayName } from '@/utils/location-display';

function StateCard({
  icon,
  iconColor,
  title,
  description,
  buttonLabel,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  title: string;
  description: string;
  buttonLabel: string;
  onPress: () => void;
}) {
  return (
    <View className="flex-1 items-center justify-center py-32 px-8">
      <View
        className="bg-md-surface rounded-3xl p-8 items-center gap-4 w-full border border-glass-border"
        style={getGlassStyle(20)}
      >
        <Ionicons name={icon} size={52} color={iconColor} />
        <Text className="text-md-on-surface text-center text-base font-semibold">{title}</Text>
        <Text className="text-md-on-surface-variant text-center text-sm leading-5">
          {description}
        </Text>
        <Button variant="filled" label={buttonLabel} className="mt-2" onPress={onPress} />
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    effectiveLocation,
    displayName,
    isLoading: locationLoading,
    error: locationError,
  } = useEffectiveLocation();

  const { data: weatherData, isLoading, error, refetch, isRefetching } = useWeather(effectiveLocation);

  const isLoadingCombined = locationLoading || isLoading;
  const errorCombined = locationError || error;
  const townshipDisplayName = effectiveLocation
    ? formatLocationDisplayName(effectiveLocation, 'township')
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
      <GlassBackground>
        <BlurDecorative color="accent" size="xl" position="top-right" opacity={0.15} />
        <BlurDecorative color="tertiary" size="lg" position="bottom-left" opacity={0.1} />

        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingBottom: insets.bottom + 80,
            paddingTop: 8,
          }}
        >
          <Stack.Screen options={{ headerTitle: townshipDisplayName }} />

          {isLoadingCombined ? (
            <View className="flex-1 items-center justify-center py-32">
              <LoadingSpinner size="lg" label="載入天氣資料..." />
            </View>
          ) : errorCombined ? (
            <StateCard
              icon="cloud-offline-outline"
              iconColor="#7B8FA0"
              title="無法取得天氣資料"
              description={errorCombined.message}
              buttonLabel="前往選擇地點"
              onPress={() => router.push('/locations')}
            />
          ) : weatherData && weatherCardLocation ? (
            <View className="gap-6">
              <View className="px-4 pt-1">
                <Button
                  variant="tonal"
                  size="sm"
                  label={isRefetching ? '更新中...' : '手動刷新'}
                  onPress={() => {
                    void refetch();
                  }}
                  disabled={isRefetching}
                />
              </View>
              <CurrentWeatherCard
                data={weatherData.current}
                location={weatherCardLocation}
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
            <StateCard
              icon="location-outline"
              iconColor="var(--color-md-primary)"
              title="選擇你的地點"
              description="前往地點管理選擇城市，或開啟定位服務自動抓取你的所在位置。"
              buttonLabel="前往選擇地點"
              onPress={() => router.push('/locations')}
            />
          )}
        </ScrollView>
      </GlassBackground>
    </ErrorBoundary>
  );
}
