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
        className={`items-center gap-2 rounded-[22px] py-3.5 ${
          isCurrent
            ? 'bg-white/18 border-[1.5px] border-white/30 shadow-sm'
            : 'bg-white/12 border border-white/18'
        }`}
        style={[{ width: 76 }, getGlassStyle(16)]}
      >
        <Text
          className={`text-[10px] font-bold uppercase tracking-[0.8px] ${isCurrent ? 'text-md-on-surface/90' : 'text-md-on-surface-variant/82'}`}
        >
          {formatTime(item.timestamp)}
        </Text>
        <View
          className={`h-9 w-9 items-center justify-center rounded-full ${
            isCurrent ? 'bg-white/14' : 'bg-white/10'
          }`}
        >
          <WeatherIcon weatherCode={item.weatherCode} size={26} />
        </View>
        <Text className="text-[16px] font-bold tracking-tight text-md-on-surface">
          {Math.round(item.temperature)}°
        </Text>
        <View className="flex-row items-center gap-0.5">
          <AppIcon
            name="water"
            size={9}
            color={isCurrent ? 'rgba(255,255,255,0.84)' : 'var(--color-md-primary)'}
          />
          <Text
            className={`text-[10px] font-bold ${isCurrent ? 'text-md-on-surface/82' : 'text-md-primary'}`}
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
        <Text className="px-4 text-[11px] font-bold uppercase tracking-[1.2px] text-md-on-surface-variant">
          逐時預報
        </Text>
        <View
          className="mx-4 items-center justify-center rounded-[24px] border border-white/18 bg-white/12 p-4"
          style={getGlassStyle(16)}
        >
          <Text className="text-sm text-md-on-surface-variant">無逐時預報資料</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="gap-4">
      <Text className="px-4 text-[11px] font-bold uppercase tracking-[1.2px] text-md-on-surface-variant">
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
