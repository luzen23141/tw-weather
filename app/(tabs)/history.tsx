import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BlurDecorative } from '@/components/ui/BlurDecorative';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { GlassBackground } from '@/components/ui/GlassBackground';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { SourceBadge } from '@/components/ui/SourceBadge';
import { useEffectiveLocation } from '@/hooks/useEffectiveLocation';
import { useHistory } from '@/hooks/useHistory';
import { useMDColors } from '@/hooks/useMDColors';
import { useSettingsStore } from '@/store/settings.store';
import { formatDate } from '@/utils/date';
import { getGlassStyle } from '@/utils/glass';

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const colors = useMDColors();
  const { displayMode } = useSettingsStore();
  const {
    effectiveLocation,
    isLoading: locationLoading,
    error: locationError,
  } = useEffectiveLocation();
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const dateStr = new Date().toISOString().split('T')[0];
    return dateStr ?? '';
  });

  const { data: historyData, isLoading, error } = useHistory(effectiveLocation ?? null, 30);

  const isLoading_combined = locationLoading || isLoading;
  const error_combined = locationError || error;

  const selectedDayData = historyData?.find((d) => d.date === selectedDate);

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
          <BlurDecorative color="secondary" size="md" position="bottom-left" />

          {isLoading_combined ? (
            <View className="flex-1 items-center justify-center py-32">
              <LoadingSpinner size="lg" label="載入中..." />
            </View>
          ) : error_combined ? (
            <View className="flex-1 items-center justify-center py-32">
              <Text className="text-md-on-surface-variant text-sm">{error_combined.message}</Text>
            </View>
          ) : effectiveLocation && historyData && historyData.length > 0 ? (
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
                <SourceBadge source={displayMode === 'aggregate' ? 'aggregate' : 'open-meteo'} />
              </View>

              {/* 日期選擇 */}
              <View className="gap-2">
                <Text className="text-xs font-bold text-md-on-surface-variant uppercase tracking-wider px-4">
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
                        onPress={() => setSelectedDate(item.date)}
                        className={`rounded-2xl px-3 py-2.5 items-center justify-center min-w-14 ${
                          isSelected ? 'bg-md-primary' : 'bg-md-surface border border-glass-border'
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

              {/* 選定日期的天氣資料 */}
              {selectedDayData ? (
                <View className="px-4 gap-3">
                  <Text className="text-sm font-bold text-md-on-surface">
                    {formatDate(selectedDate)}
                  </Text>

                  {/* 統計 Bento Grid */}
                  <View className="flex-row gap-3">
                    <View
                      className="flex-1 bg-md-surface rounded-2xl p-4 gap-1 border border-glass-border"
                      style={getGlassStyle(16)}
                    >
                      <View className="flex-row items-center gap-1.5 mb-1">
                        <Ionicons name="thermometer-outline" size={13} color={colors.primary} />
                        <Text className="text-xs text-md-on-surface-variant">最低溫度</Text>
                      </View>
                      <Text className="text-2xl font-bold text-md-primary">
                        {Math.round(selectedDayData.temperatureMin)}°
                      </Text>
                    </View>

                    <View
                      className="flex-1 bg-md-surface rounded-2xl p-4 gap-1 border border-glass-border"
                      style={getGlassStyle(16)}
                    >
                      <View className="flex-row items-center gap-1.5 mb-1">
                        <Ionicons name="thermometer-outline" size={13} color={colors.error} />
                        <Text className="text-xs text-md-on-surface-variant">最高溫度</Text>
                      </View>
                      <Text className="text-2xl font-bold text-md-error">
                        {Math.round(selectedDayData.temperatureMax)}°
                      </Text>
                    </View>
                  </View>

                  <View
                    className="bg-md-surface rounded-2xl p-4 border border-glass-border"
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
                <View className="px-4 py-12 items-center justify-center">
                  <Text className="text-md-on-surface-variant text-sm">無該日期的歷史資料</Text>
                </View>
              )}
            </View>
          ) : (
            <View className="flex-1 items-center justify-center py-32">
              <Ionicons name="time-outline" size={48} color={colors.outline} />
              <Text className="text-md-on-surface-variant mt-3 text-sm">無歷史資料</Text>
            </View>
          )}
        </ScrollView>
      </GlassBackground>
    </ErrorBoundary>
  );
}
