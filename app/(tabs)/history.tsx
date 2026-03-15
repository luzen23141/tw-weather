import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';

import { AnimatedEntry } from '@/components/ui/AnimatedEntry';
import { MAX_HISTORY_FETCH_DAYS } from '@/api/weather.service';
import { BlurDecorative } from '@/components/ui/BlurDecorative';
import { Button } from '@/components/ui/Button';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { GlassBackground } from '@/components/ui/GlassBackground';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { PageHeaderCard } from '@/components/ui/PageHeaderCard';
import { PageScrollView } from '@/components/ui/PageScrollView';
import { PageState } from '@/components/ui/PageState';
import { SkeletonBox, SkeletonProvider } from '@/components/ui/SkeletonLoader';
import { SourceBadge } from '@/components/ui/SourceBadge';
import { StatCard } from '@/components/ui/StatCard';
import { useEffectiveLocation } from '@/hooks/useEffectiveLocation';
import { useHistory } from '@/hooks/useHistory';
import { useSettingsStore } from '@/store/settings.store';
import { formatDate, daysAgo } from '@/utils/date';
import { getWeatherErrorMessage } from '@/utils/error-message';
import { getGlassStyle } from '@/components/ui/glass';
import { formatLocationSecondaryName } from '@/utils/location-display';

function HistorySkeleton() {
  return (
    <SkeletonProvider>
      <View className="gap-6">
        {/* PageHeaderCard 骨架 */}
        <View
          className="mx-4 rounded-3xl border border-glass-border bg-md-surface-container px-5 py-4 gap-3"
          style={getGlassStyle(20)}
        >
          <View className="flex-row items-center gap-3">
            <SkeletonBox height={40} width={40} borderRadius={20} />
            <View className="flex-1 gap-2">
              <SkeletonBox height={10} width="30%" borderRadius={4} />
              <SkeletonBox height={18} width="55%" borderRadius={5} />
            </View>
          </View>
          <SkeletonBox height={32} width={100} borderRadius={8} />
        </View>

        {/* 日期選擇器骨架 */}
        <View className="gap-2">
          <SkeletonBox height={12} width={60} borderRadius={4} className="mx-4" />
          <View className="flex-row gap-2" style={{ paddingHorizontal: 16 }}>
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <SkeletonBox key={i} height={44} width={52} borderRadius={16} />
            ))}
          </View>
        </View>

        {/* 資料卡骨架 */}
        <View className="gap-4 px-4">
          <SkeletonBox height={14} width={100} borderRadius={4} />
          <View className="flex-row gap-3">
            <View
              className="flex-1 rounded-3xl border border-glass-border bg-md-surface-container px-4 py-4 gap-2"
              style={getGlassStyle(16)}
            >
              <SkeletonBox height={12} width="60%" borderRadius={4} />
              <SkeletonBox height={32} width="45%" borderRadius={6} />
            </View>
            <View
              className="flex-1 rounded-3xl border border-glass-border bg-md-surface-container px-4 py-4 gap-2"
              style={getGlassStyle(16)}
            >
              <SkeletonBox height={12} width="60%" borderRadius={4} />
              <SkeletonBox height={32} width="45%" borderRadius={6} />
            </View>
          </View>
          <View
            className="rounded-3xl border border-glass-border bg-md-surface-container px-4 py-4"
            style={getGlassStyle(16)}
          >
            <View className="flex-row items-center justify-between">
              <SkeletonBox height={12} width="40%" borderRadius={4} />
              <SkeletonBox height={16} width="25%" borderRadius={4} />
            </View>
          </View>
        </View>
      </View>
    </SkeletonProvider>
  );
}

export default function HistoryScreen() {
  const router = useRouter();
  const { displayMode } = useSettingsStore();
  const {
    effectiveLocation,
    isLoading: locationLoading,
    error: locationError,
  } = useEffectiveLocation();
  const [selectedDate, setSelectedDate] = useState('');

  const {
    data: historyData,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useHistory(effectiveLocation ?? null, MAX_HISTORY_FETCH_DAYS);

  const historyDateMap = useMemo(
    () => new Map(historyData?.map((d) => [d.date, d]) ?? []),
    [historyData],
  );

  const isLoadingCombined = locationLoading || (!!effectiveLocation && isLoading);
  const selectedDayData = historyDateMap.get(selectedDate) ?? null;

  const locationSecondaryText = effectiveLocation
    ? formatLocationSecondaryName(effectiveLocation)
    : null;

  useEffect(() => {
    if (!historyData || historyData.length === 0) {
      return;
    }

    const hasSelectedDate = historyDateMap.has(selectedDate);
    if (!selectedDate || !hasSelectedDate) {
      const latestAvailableDate = historyData[0]?.date;
      if (latestAvailableDate) {
        setSelectedDate(latestAvailableDate);
      }
    }
  }, [historyData, selectedDate]);

  return (
    <ErrorBoundary
      fallback={
        <GlassBackground className="items-center justify-center">
          <LoadingSpinner label="頁面出錯，請重新整理" />
        </GlassBackground>
      }
    >
      <GlassBackground>
        <PageScrollView
          onRefresh={() => {
            void refetch();
          }}
          refreshing={isRefetching}
        >
          <BlurDecorative color="accent" size="xl" position="top-right" />
          <BlurDecorative color="secondary" size="md" position="bottom-left" />

          {isLoadingCombined ? (
            <PageState type="loading" skeleton={<HistorySkeleton />} />
          ) : !effectiveLocation ? (
            <PageState
              type="empty"
              title="請先選擇地點"
              description={
                locationError
                  ? '目前無法取得你的定位，請先手動選擇地點，再查看最近 7 天的歷史天氣。'
                  : '前往地點管理選擇城市後，即可查看最近 7 天的歷史天氣。'
              }
              actionLabel="前往選擇地點"
              onActionPress={() => router.push('/locations')}
            />
          ) : error ? (
            <PageState
              type="error"
              title="無法取得歷史資料"
              description={getWeatherErrorMessage(error)}
              actionLabel="重試"
              onActionPress={() => {
                void refetch();
              }}
            />
          ) : effectiveLocation && historyData && historyData.length > 0 ? (
            <View className="gap-7">
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

              <View className="gap-3">
                <Text className="px-4 text-xs font-bold uppercase tracking-[1.4px] text-md-on-surface-variant">
                  選擇日期
                </Text>
                <FlatList
                  data={historyData}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(item) => item.date}
                  contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
                  initialNumToRender={7}
                  maxToRenderPerBatch={7}
                  windowSize={3}
                  renderItem={({ item }) => {
                    const isSelected = item.date === selectedDate;
                    const dateObj = new Date(item.date);
                    const dayStr = dateObj.getDate().toString();
                    const monthStr = (dateObj.getMonth() + 1).toString().padStart(2, '0');
                    return (
                      <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel={`選擇 ${monthStr}/${dayStr}`}
                        onPress={() => setSelectedDate(item.date)}
                        className={`min-w-14 min-h-11 items-center justify-center rounded-2xl px-3 py-2.5 transition-colors duration-200 ${
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
                  }}
                />
              </View>

              {selectedDayData ? (
                <AnimatedEntry key={selectedDate} delay={40} duration={280}>
                  <View className="gap-4 px-4">
                    <View
                      className="rounded-[26px] border border-glass-border-strong bg-md-surface px-5 py-4"
                      style={getGlassStyle(16)}
                    >
                      <Text className="text-xs font-bold uppercase tracking-[1.4px] text-md-primary">
                        歷史摘要
                      </Text>
                      <Text className="mt-2 text-lg font-bold text-md-on-surface">
                        {formatDate(selectedDate)}
                      </Text>
                      <Text className="mt-1 text-sm leading-6 text-md-on-surface-variant">
                        {daysAgo(selectedDate) === 0
                          ? '這是今天目前可取得的歷史資料。'
                          : `${daysAgo(selectedDate)} 天前的觀測摘要。`}
                      </Text>
                    </View>

                    <View className="flex-row flex-wrap gap-3">
                      <StatCard
                        iconType="thermometer"
                        label="最低溫"
                        value={`${Math.round(selectedDayData.temperatureMin)}°`}
                        iconColor="#0ea5e9"
                      />
                      <StatCard
                        iconType="thermometer"
                        label="最高溫"
                        value={`${Math.round(selectedDayData.temperatureMax)}°`}
                        iconColor="#f97316"
                      />
                      <StatCard
                        iconType="wind"
                        label="日較差"
                        value={`${Math.round(selectedDayData.temperatureMax - selectedDayData.temperatureMin)}°`}
                        iconColor="#14b8a6"
                      />
                      <StatCard
                        iconType="precipitation"
                        label="總降水量"
                        value={`${selectedDayData.precipitationSum.toFixed(1)} mm`}
                        iconColor="#6366f1"
                      />
                    </View>
                  </View>
                </AnimatedEntry>
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
