import React, { useCallback, useMemo } from 'react';
import { FlatList, ListRenderItem, Text, View } from 'react-native';

import { AppIcon } from '@/components/icons/AppIcon';

import { DailyForecast } from '../../api/types';
import { getDayOfWeek } from '../../utils/date';
import { getGlassStyle } from '../ui/glass';
import { WeatherIcon } from '../icons/WeatherIcon';

export interface DailyForecastListProps {
  forecasts: DailyForecast[];
}

const ITEM_HEIGHT = 72;

const DailyItem = React.memo(
  ({
    item,
    isFirst,
    isLast,
    globalMin,
    globalMax,
  }: {
    item: DailyForecast;
    isFirst: boolean;
    isLast: boolean;
    globalMin: number;
    globalMax: number;
  }) => {
    const range = globalMax - globalMin;
    const barStart = range > 0 ? (item.temperatureMin - globalMin) / range : 0;
    const barWidth = range > 0 ? (item.temperatureMax - item.temperatureMin) / range : 1;

    return (
      <View
        className={`flex-row items-center px-4 py-4 gap-3 bg-md-surface-container transition-colors hover:bg-md-surface-variant/30 ${
          !isLast ? 'border-b border-glass-border' : ''
        } ${isFirst ? 'rounded-t-3xl' : ''} ${isLast ? 'rounded-b-3xl' : ''}`}
      >
        {/* 星期 */}
        <Text className="w-8 text-sm font-semibold text-md-on-surface-variant">
          {getDayOfWeek(item.date)}
        </Text>

        {/* 天氣圖示 */}
        <View className="h-10 w-10 items-center justify-center rounded-full bg-md-primary/10">
          <WeatherIcon weatherCode={item.weatherCode} size={28} />
        </View>

        {/* 溫度範圍 bar */}
        <View className="flex-1 gap-1">
          <View className="flex-row items-center justify-between">
            <Text className="text-xs text-md-primary font-semibold">
              {Math.round(item.temperatureMin)}°
            </Text>
            <Text className="text-xs font-bold text-md-on-surface">
              {Math.round(item.temperatureMax)}°
            </Text>
          </View>
          {/* 溫度 Bar */}
          <View className="h-2 rounded-full bg-md-surface-variant/30 overflow-hidden">
            <View
              className="h-full bg-md-primary rounded-full absolute"
              style={{ left: `${barStart * 100}%`, width: `${barWidth * 100}%` }}
            />
          </View>
        </View>

        {/* 降雨機率 */}
        <View className="flex-row items-center gap-1 w-12 justify-end">
          <AppIcon name="water" size={10} color="var(--color-md-primary)" />
          <Text className="text-xs text-md-primary font-semibold">
            {item.precipitationProbability}%
          </Text>
        </View>
      </View>
    );
  },
);

export const DailyForecastList = React.memo(function DailyForecastList({
  forecasts,
}: DailyForecastListProps): React.ReactElement {
  const { globalMin, globalMax } = useMemo(() => {
    if (!forecasts || forecasts.length === 0) return { globalMin: 0, globalMax: 40 };
    const mins = forecasts.map((f) => f.temperatureMin);
    const maxs = forecasts.map((f) => f.temperatureMax);
    return {
      globalMin: Math.min(...mins),
      globalMax: Math.max(...maxs),
    };
  }, [forecasts]);

  const renderItem: ListRenderItem<DailyForecast> = useCallback(
    ({ item, index }) => (
      <DailyItem
        item={item}
        isFirst={index === 0}
        isLast={index === (forecasts.length ?? 1) - 1}
        globalMin={globalMin}
        globalMax={globalMax}
      />
    ),
    [forecasts.length, globalMin, globalMax],
  );

  const keyExtractor = useCallback((item: DailyForecast) => item.date, []);

  const getItemLayout = useCallback(
    (_: ArrayLike<DailyForecast> | null | undefined, index: number) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    }),
    [],
  );

  if (!forecasts || forecasts.length === 0) {
    return (
      <View className="gap-4">
        <Text className="px-4 text-xs font-bold uppercase tracking-[1.4px] text-md-on-surface-variant">
          7 日預報
        </Text>
        <View
          className="bg-md-surface-variant border border-glass-border rounded-2xl p-4 mx-4 items-center justify-center"
          style={getGlassStyle(16)}
        >
          <Text className="text-sm text-md-on-surface-variant">無每日預報資料</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="gap-4">
      <Text className="px-4 text-xs font-bold uppercase tracking-[1.4px] text-md-on-surface-variant">
        7 日預報
      </Text>
      <View
        className="mx-4 overflow-hidden rounded-3xl border border-glass-border-strong shadow-glass"
        style={getGlassStyle(20)}
      >
        <FlatList
          data={forecasts}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          getItemLayout={getItemLayout}
          scrollEnabled={false}
          removeClippedSubviews
          maxToRenderPerBatch={7}
          windowSize={3}
          initialNumToRender={7}
        />
      </View>
    </View>
  );
});
