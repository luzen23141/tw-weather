import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useMemo } from 'react';
import { FlatList, ListRenderItem, Text, View } from 'react-native';

import { DailyForecast } from '../../api/types';
import { getDayOfWeek } from '../../utils/date';
import { getGlassStyle } from '../../utils/glass';
import { getWeatherCodeInfo } from '../../utils/weather-code';

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
    const weatherInfo = getWeatherCodeInfo(item.weatherCode);
    const range = globalMax - globalMin;
    const barStart = range > 0 ? (item.temperatureMin - globalMin) / range : 0;
    const barWidth = range > 0 ? (item.temperatureMax - item.temperatureMin) / range : 1;

    return (
      <View
        className={`flex-row items-center px-4 py-4 gap-3 bg-md-surface-container-low transition-colors hover:bg-md-surface-variant/30 ${
          !isLast ? 'border-b border-glass-border' : ''
        } ${isFirst ? 'rounded-t-2xl' : ''} ${isLast ? 'rounded-b-2xl' : ''}`}
      >
        {/* 星期 */}
        <Text className="w-8 text-sm font-semibold text-md-on-surface-variant">
          {getDayOfWeek(item.date)}
        </Text>

        {/* 天氣圖示 */}
        <Text style={{ fontSize: 22, width: 28, textAlign: 'center' }}>{weatherInfo.emoji}</Text>

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
          <View className="h-1.5 bg-md-surface-variant/50 rounded-full overflow-hidden">
            <View
              className="h-full bg-md-primary rounded-full absolute"
              style={{ left: `${barStart * 100}%`, width: `${barWidth * 100}%` }}
            />
          </View>
        </View>

        {/* 降雨機率 */}
        <View className="flex-row items-center gap-0.5 w-10 justify-end">
          <Ionicons name="water" size={10} color="var(--color-md-primary)" />
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
      <View className="gap-3">
        <Text className="text-base font-bold text-md-on-background px-4">7 日預報</Text>
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
    <View className="gap-3">
      <Text className="text-base font-bold text-md-on-background px-4">7 日預報</Text>
      <View
        className="mx-4 rounded-2xl overflow-hidden border border-glass-border shadow-glass"
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
