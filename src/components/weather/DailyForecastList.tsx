import React, { useMemo } from 'react';
import { Text, View } from 'react-native';

import { AppIcon } from '@/components/icons/AppIcon';

import { DailyForecast } from '../../api/types';
import { getDayOfWeek } from '../../utils/date';
import { getGlassStyle } from '../ui/glass';
import { WeatherIcon } from '../icons/WeatherIcon';

export interface DailyForecastListProps {
  forecasts: DailyForecast[];
}

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
        className={`flex-row items-center gap-3 bg-white/12 px-4 py-3.5 ${
          !isLast ? 'border-b border-white/12' : ''
        } ${isFirst ? 'rounded-t-3xl' : ''} ${isLast ? 'rounded-b-3xl' : ''}`}
      >
        <Text className="w-10 text-[12px] font-bold tracking-[0.2px] text-md-on-surface-variant/84">
          {isFirst ? '今天' : getDayOfWeek(item.date)}
        </Text>

        <View className="h-9 w-9 items-center justify-center rounded-full bg-white/10">
          <WeatherIcon weatherCode={item.weatherCode} size={26} />
        </View>

        <Text className="w-9 text-right text-[12px] font-semibold text-md-on-surface-variant/82">
          {Math.round(item.temperatureMin)}°
        </Text>

        {/* Temperature range bar */}
        <View className="h-[6px] flex-1 overflow-hidden rounded-full bg-white/10">
          <View
            className="h-full rounded-full"
            style={{
              position: 'absolute',
              left: `${barStart * 100}%`,
              width: `${Math.max(barWidth * 100, 8)}%`,
              backgroundColor: 'rgba(255,255,255,0.82)',
              opacity: 0.7 + barWidth * 0.3,
            }}
          />
        </View>

        <Text className="w-9 text-[13px] font-bold tracking-tight text-md-on-surface">
          {Math.round(item.temperatureMax)}°
        </Text>

        <View className="w-11 flex-row items-center justify-end gap-0.5">
          <AppIcon name="water" size={9} color="var(--color-md-primary)" />
          <Text className="text-[10px] font-bold text-md-primary">
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

  if (!forecasts || forecasts.length === 0) {
    return (
      <View className="gap-4">
        <Text className="px-4 text-[11px] font-bold uppercase tracking-[1.2px] text-md-on-surface-variant">
          7 日預報
        </Text>
        <View
          className="mx-4 items-center justify-center rounded-[24px] border border-white/18 bg-white/12 p-4"
          style={getGlassStyle(16)}
        >
          <Text className="text-sm text-md-on-surface-variant">無每日預報資料</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="gap-4">
      <Text className="px-4 text-[11px] font-bold uppercase tracking-[1.2px] text-md-on-surface-variant">
        7 日預報
      </Text>
      <View
        className="mx-4 overflow-hidden rounded-3xl border border-white/20 bg-white/8 shadow-glass"
        style={getGlassStyle(20)}
      >
        {forecasts.map((item, index) => (
          <DailyItem
            key={item.date}
            item={item}
            isFirst={index === 0}
            isLast={index === forecasts.length - 1}
            globalMin={globalMin}
            globalMax={globalMax}
          />
        ))}
      </View>
    </View>
  );
});
