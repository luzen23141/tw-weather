import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { MAX_HISTORY_FETCH_DAYS } from '@/api/weather.service';
import { BlurDecorative } from '@/components/ui/BlurDecorative';
import { Button } from '@/components/ui/Button';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { GlassBackground } from '@/components/ui/GlassBackground';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { PageHeaderCard } from '@/components/ui/PageHeaderCard';
import { PageScrollView } from '@/components/ui/PageScrollView';
import { PageState } from '@/components/ui/PageState';
import { SourceBadge } from '@/components/ui/SourceBadge';
import { useEffectiveLocation } from '@/hooks/useEffectiveLocation';
import { useHistory } from '@/hooks/useHistory';
import { useMDColors } from '@/hooks/useMDColors';
import { useSettingsStore } from '@/store/settings.store';
import { formatDate } from '@/utils/date';
import { getGlassStyle } from '@/utils/glass';
import { formatLocationSecondaryName } from '@/utils/location-display';

export default function HistoryScreen() {
  const colors = useMDColors();
  const { displayMode, locationDisplayFormat } = useSettingsStore();
  const {
    effectiveLocation,
    isLoading: locationLoading,
    error: locationError,
  } = useEffectiveLocation();
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const dateStr = new Date().toISOString().split('T')[0];
    return dateStr ?? '';
  });

  const {
    data: historyData,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useHistory(effectiveLocation ?? null, MAX_HISTORY_FETCH_DAYS);

  const isLoadingCombined = locationLoading || isLoading;
  const errorCombined = locationError || error;
  const selectedDayData = historyData?.find((d) => d.date === selectedDate);

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
          <BlurDecorative color="secondary" size="md" position="bottom-left" />

          {isLoadingCombined ? (
            <PageState type="loading" title="載入歷史資料" description="正在取得歷史天氣紀錄。" />
          ) : errorCombined ? (
            <PageState type="error" title="無法取得歷史資料" description={errorCombined.message} />
          ) : effectiveLocation && historyData && historyData.length > 0 ? (
            <View className="gap-6">
              <PageHeaderCard
                icon="time-outline"
                title={effectiveLocation.name}
                subtitle={locationSecondaryText}
                eyebrow="歷史天氣與日期瀏覽"
                rightSlot={
                  <SourceBadge source={displayMode === 'aggregate' ? 'aggregate' : 'open-meteo'} />
                }
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

              <View className="gap-2">
                <Text className="px-4 text-xs font-bold uppercase tracking-[1.6px] text-md-on-surface-variant">
                  選擇日期
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
                >
                  {historyData.map((item) => {
                    const isSelected = item.date === selectedDate;
                    const dateObj = new Date(item.date);
                    const dayStr = dateObj.getDate().toString();
                    const monthStr = (dateObj.getMonth() + 1).toString().padStart(2, '0');

                    return (
                      <TouchableOpacity
                        key={item.date}
                        accessibilityRole="button"
                        accessibilityLabel={`選擇 ${monthStr}/${dayStr}`}
                        onPress={() => setSelectedDate(item.date)}
                        className={`min-w-14 min-h-11 items-center justify-center rounded-2xl px-3 py-2.5 ${
                          isSelected
                            ? 'bg-md-primary'
                            : 'border border-glass-border-strong bg-md-surface-container'
                        }`}
                        style={!isSelected ? getGlassStyle(16) : undefined}
                      >
                        <Text
                          className={`text-xs font-semibold ${
                            isSelected ? 'text-md-on-primary' : 'text-md-on-surface-variant'
                          }`}
                        >
                          {monthStr}/{dayStr}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {selectedDayData ? (
                <View className="gap-4 px-4">
                  <Text className="text-sm font-bold text-md-on-surface">
                    {formatDate(selectedDate)}
                  </Text>

                  <View className="flex-row gap-3">
                    <View
                      className="flex-1 rounded-3xl border border-glass-border-strong bg-md-surface-container px-4 py-4"
                      style={getGlassStyle(16)}
                    >
                      <View className="mb-1 flex-row items-center gap-1.5">
                        <Ionicons name="thermometer-outline" size={13} color={colors.primary} />
                        <Text className="text-xs text-md-on-surface-variant">最低溫度</Text>
                      </View>
                      <Text className="text-2xl font-bold text-md-primary">
                        {Math.round(selectedDayData.temperatureMin)}°
                      </Text>
                    </View>

                    <View
                      className="flex-1 rounded-3xl border border-glass-border-strong bg-md-surface-container px-4 py-4"
                      style={getGlassStyle(16)}
                    >
                      <View className="mb-1 flex-row items-center gap-1.5">
                        <Ionicons name="thermometer-outline" size={13} color={colors.error} />
                        <Text className="text-xs text-md-on-surface-variant">最高溫度</Text>
                      </View>
                      <Text className="text-2xl font-bold text-md-error">
                        {Math.round(selectedDayData.temperatureMax)}°
                      </Text>
                    </View>
                  </View>

                  <View
                    className="rounded-3xl border border-glass-border-strong bg-md-surface-container px-4 py-4"
                    style={getGlassStyle(16)}
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-1.5">
                        <Ionicons name="rainy-outline" size={13} color={colors.primary} />
                        <Text className="text-xs text-md-on-surface-variant">總降水量</Text>
                      </View>
                      <Text className="text-base font-bold text-md-primary">
                        {selectedDayData.precipitationSum.toFixed(1)} mm
                      </Text>
                    </View>
                  </View>
                </View>
              ) : (
                <PageState type="empty" title="無該日期的歷史資料" description="請改選其他日期。" />
              )}
            </View>
          ) : (
            <PageState
              type="empty"
              title="無歷史資料"
              description="目前地點尚未有可用歷史天氣紀錄。"
            />
          )}
        </PageScrollView>
      </GlassBackground>
    </ErrorBoundary>
  );
}
