import { Ionicons } from '@expo/vector-icons';
import React, { useCallback } from 'react';
import { FlatList, ListRenderItem, Text, View } from 'react-native';

import { HourlyForecast } from '../../api/types';
import { formatTime } from '../../utils/date';
import { getGlassStyle } from '../../utils/glass';
import { getWeatherCodeInfo } from '../../utils/weather-code';

export interface HourlyForecastListProps {
  forecasts: HourlyForecast[];
}

// w-20(80px) + px-3 兩側(12+12=24) = 104px
const ITEM_WIDTH = 104;

const HourlyItem = React.memo(
  ({ item, isCurrent }: { item: HourlyForecast; isCurrent: boolean }) => {
    const weatherInfo = getWeatherCodeInfo(item.weatherCode);

    return (
      <View
        className={`rounded-2xl p-3 gap-2 items-center transition-all ${
          isCurrent
            ? 'bg-md-primary-container border border-glass-border-strong shadow-sm'
            : 'bg-md-surface-variant border border-glass-border'
        }`}
        style={[{ width: 80 }, getGlassStyle(16)]}
      >
        <Text
          className={`text-xs font-semibold ${isCurrent ? 'text-md-on-primary-container' : 'text-md-on-surface-variant'}`}
        >
          {formatTime(item.timestamp)}
        </Text>
        <Text style={{ fontSize: 24 }}>{weatherInfo.emoji}</Text>
        <Text
          className={`text-sm font-bold ${isCurrent ? 'text-md-on-primary-container' : 'text-md-on-surface'}`}
        >
          {Math.round(item.temperature)}°
        </Text>
        <View className="flex-row items-center gap-0.5">
          <Ionicons
            name="water"
            size={9}
            color={isCurrent ? 'var(--color-md-on-primary-container)' : 'var(--color-md-primary)'}
          />
          <Text
            className={`text-xs font-medium ${isCurrent ? 'text-md-on-primary-container opacity-80' : 'text-md-primary'}`}
          >
            {item.precipitationProbability}%
          </Text>
        </View>
      </View>
    );
  },
);

export const HourlyForecastList = React.memo(function HourlyForecastList({
  forecasts,
}: HourlyForecastListProps): React.ReactElement {
  const renderItem: ListRenderItem<HourlyForecast> = useCallback(
    ({ item, index }) => <HourlyItem item={item} isCurrent={index === 0} />,
    [],
  );

  const keyExtractor = useCallback((item: HourlyForecast) => item.timestamp, []);

  const getItemLayout = useCallback(
    (_: ArrayLike<HourlyForecast> | null | undefined, index: number) => ({
      length: ITEM_WIDTH,
      offset: ITEM_WIDTH * index,
      index,
    }),
    [],
  );

  if (!forecasts || forecasts.length === 0) {
    return (
      <View className="gap-3">
        <Text className="text-base font-bold text-md-on-background px-4">逐時預報</Text>
        <View
          className="bg-md-surface-variant border border-glass-border rounded-2xl p-4 mx-4 items-center justify-center"
          style={getGlassStyle(16)}
        >
          <Text className="text-sm text-md-on-surface-variant">無逐時預報資料</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="gap-3">
      <Text className="text-base font-bold text-md-on-background px-4">逐時預報</Text>
      <FlatList
        data={forecasts.slice(0, 24)}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        getItemLayout={getItemLayout}
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        removeClippedSubviews
        maxToRenderPerBatch={8}
        windowSize={5}
        initialNumToRender={6}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
      />
    </View>
  );
});
