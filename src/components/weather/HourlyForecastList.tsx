import React, { useCallback } from 'react';
import { FlatList, ListRenderItem, Platform, Text, View } from 'react-native';

import { AppIcon } from '@/components/icons/AppIcon';

import { HourlyForecast } from '../../api/types';
import { formatTime } from '../../utils/date';
import { getGlassStyle } from '../ui/glass';
import { WeatherIcon } from '../icons/WeatherIcon';

export interface HourlyForecastListProps {
  forecasts: HourlyForecast[];
}

// w-[76px] + gap-8px = 84px per item
const ITEM_WIDTH = 84;

const HourlyItem = React.memo(
  ({ item, isCurrent }: { item: HourlyForecast; isCurrent: boolean }) => {
    return (
      <View
        className={`rounded-[22px] py-3.5 gap-2.5 items-center ${
          isCurrent
            ? 'bg-md-primary-container border-[1.5px] border-md-primary/30 shadow-sm'
            : 'bg-md-surface-container/80 border border-glass-border'
        }`}
        style={[{ width: 76 }, getGlassStyle(16)]}
      >
        <Text
          className={`text-[11px] font-semibold ${isCurrent ? 'text-md-on-primary-container' : 'text-md-on-surface-variant'}`}
        >
          {formatTime(item.timestamp)}
        </Text>
        <View
          className={`h-9 w-9 items-center justify-center rounded-full ${
            isCurrent ? 'bg-md-on-primary-container/10' : 'bg-md-primary/8'
          }`}
        >
          <WeatherIcon weatherCode={item.weatherCode} size={26} />
        </View>
        <Text
          className={`text-[15px] font-bold tracking-tight ${isCurrent ? 'text-md-on-primary-container' : 'text-md-on-surface'}`}
        >
          {Math.round(item.temperature)}°
        </Text>
        <View className="flex-row items-center gap-0.5">
          <AppIcon
            name="water"
            size={9}
            color={isCurrent ? 'var(--color-md-on-primary-container)' : 'var(--color-md-primary)'}
          />
          <Text
            className={`text-[10px] font-semibold ${isCurrent ? 'text-md-on-primary-container opacity-80' : 'text-md-primary'}`}
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
      <View className="gap-4">
        <Text className="px-4 text-xs font-bold uppercase tracking-[1.4px] text-md-on-surface-variant">
          逐時預報
        </Text>
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
    <View className="gap-4">
      <Text className="px-4 text-xs font-bold uppercase tracking-[1.4px] text-md-on-surface-variant">
        逐時預報
      </Text>
      <FlatList
        data={forecasts.slice(0, 24)}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        getItemLayout={getItemLayout}
        horizontal
        showsHorizontalScrollIndicator={Platform.OS === 'web'}
        scrollEventThrottle={16}
        removeClippedSubviews
        maxToRenderPerBatch={8}
        windowSize={5}
        initialNumToRender={6}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingVertical: 2 }}
      />
    </View>
  );
});
