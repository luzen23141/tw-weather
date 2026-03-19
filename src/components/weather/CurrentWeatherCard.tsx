import React from 'react';
import { Text, View } from 'react-native';

import { CurrentWeather, Location, WeatherSource } from '../../api/types';
import { formatTime } from '../../utils/date';
import { getGlassStyle } from '../ui/glass';
import { formatWindSpeed } from '../../utils/unit-conversion';
import { getWeatherCodeInfo } from '../../utils/weather-code';
import { WeatherIcon } from '../icons/WeatherIcon';
import { SourceBadge } from '../ui/SourceBadge';
import { StatCard } from '../ui/StatCard';

import { formatLocationSecondaryName } from '@/utils/location-display';
import { SOURCE_META_MAP } from '@/api/sources';

export interface CurrentWeatherCardProps {
  data: CurrentWeather;
  location: Location;
  source: WeatherSource;
  eyebrow?: string;
  actionSlot?: React.ReactNode;
  enabledSources?: WeatherSource[];
}

export const CurrentWeatherCard = React.memo(function CurrentWeatherCard({
  data,
  location,
  source,
  eyebrow,
  actionSlot,
  enabledSources,
}: CurrentWeatherCardProps): React.ReactElement {
  const weatherInfo = getWeatherCodeInfo(data.weatherCode);
  const isRangeTemp = typeof data.temperature === 'string';
  const tempDisplay = isRangeTemp ? data.temperature : `${Math.round(data.temperature)}°`;
  const secondaryLocationText = formatLocationSecondaryName(location);

  return (
    <View
      className="mx-4 overflow-hidden rounded-[30px] border border-white/18 bg-white/16 px-6 py-6 shadow-glass dark:border-white/12 dark:bg-white/8"
      style={getGlassStyle(20)}
    >
      <View className="absolute inset-x-0 top-0 h-px bg-white/26 dark:bg-white/12" />

      <View className="gap-5">
        <View className="flex-row items-start justify-between gap-4">
          <View className="flex-1 gap-1">
            {eyebrow ? (
              <Text className="text-[11px] font-bold uppercase tracking-[1.4px] text-md-primary">
                {eyebrow}
              </Text>
            ) : null}
            <Text className="text-lg font-bold tracking-tight text-md-on-surface">
              {location.name}
            </Text>
            {secondaryLocationText ? (
              <Text className="mt-1 text-[12px] font-medium text-md-on-surface-variant">
                {secondaryLocationText}
              </Text>
            ) : null}
          </View>
          <View className="items-end gap-2">
            <SourceBadge source={source} />
            {source === 'aggregate' && enabledSources?.length ? (
              <Text className="text-[10px] leading-4 text-right text-md-on-surface-variant">
                {(enabledSources ?? []).map((s) => SOURCE_META_MAP[s]?.label ?? s).join(' · ')}
              </Text>
            ) : null}
            {actionSlot ? <View>{actionSlot}</View> : null}
          </View>
        </View>

        <View
          className="flex-row items-center justify-between gap-4 rounded-[28px] border border-white/16 bg-white/14 px-5 py-5 dark:border-white/10 dark:bg-white/8"
          style={getGlassStyle(18)}
        >
          <View className="flex-1 gap-2">
            <Text className="text-[11px] font-bold uppercase tracking-[1.4px] text-md-primary">
              目前溫度
            </Text>
            <Text
              className="font-bold tracking-tighter text-md-on-surface"
              style={{ fontSize: 76, lineHeight: 82 }}
            >
              {tempDisplay}
            </Text>
            <Text className="text-[15px] font-semibold tracking-tight text-md-on-surface/90">
              {weatherInfo.description}
            </Text>
          </View>
          <View className="h-20 w-20 items-center justify-center rounded-[26px] border border-white/14 bg-white/12 dark:border-white/10 dark:bg-white/8">
            <WeatherIcon weatherCode={data.weatherCode} size={46} />
          </View>
        </View>

        <View className="flex-row flex-wrap gap-2.5">
          <StatCard
            iconType="thermometer"
            label="體感溫度"
            value={`${Math.round(data.apparentTemperature ?? data.temperature)}°`}
            iconColor="#f97316"
          />
          <StatCard
            iconType="humidity"
            label="濕度"
            value={`${Math.round(data.humidity ?? 0)}%`}
            iconColor="#0ea5e9"
          />
          <StatCard
            iconType="wind"
            label="風速"
            value={formatWindSpeed(data.windSpeed ?? 0, 'kmh')}
            iconColor="#14b8a6"
          />
          <StatCard
            iconType="precipitation"
            label="降水量"
            value={`${(data.precipitation ?? 0).toFixed(1)} mm`}
            iconColor="#6366f1"
          />
        </View>

        <Text className="pl-1 text-[13px] font-medium text-md-on-surface-variant">
          最後更新：{formatTime(data.timestamp)}
        </Text>
      </View>
    </View>
  );
});
