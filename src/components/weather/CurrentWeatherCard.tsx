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
      className="mx-4 rounded-[30px] border border-glass-border-strong bg-md-surface-container px-6 py-6 gap-5 shadow-glass-glow"
      style={getGlassStyle(24)}
    >
      <View className="flex-row items-start justify-between gap-4">
        <View className="flex-1 gap-1">
          {eyebrow ? (
            <Text className="text-[11px] font-bold uppercase tracking-[1.8px] text-md-primary">
              {eyebrow}
            </Text>
          ) : null}
          <Text className="text-lg font-bold text-md-on-surface tracking-tight">
            {location.name}
          </Text>
          {secondaryLocationText && (
            <Text className="text-xs text-md-on-surface-variant mt-1 font-medium">
              {secondaryLocationText}
            </Text>
          )}
        </View>
        <View className="items-end gap-2">
          <SourceBadge source={source} />
          {source === 'aggregate' && enabledSources?.length ? (
            <Text className="text-[10px] text-md-on-surface-variant text-right leading-4">
              {(enabledSources ?? []).map((s) => SOURCE_META_MAP[s]?.label ?? s).join(' · ')}
            </Text>
          ) : null}
          {actionSlot ? <View>{actionSlot}</View> : null}
        </View>
      </View>

      <View
        className="flex-row items-center justify-between gap-4 rounded-[28px] border border-glass-border bg-md-surface px-5 py-5"
        style={getGlassStyle(18)}
      >
        <View className="flex-1 gap-2">
          <Text className="text-[11px] font-bold uppercase tracking-[2px] text-md-primary">
            目前溫度
          </Text>
          <Text
            className="font-bold text-md-on-surface tracking-tighter"
            style={{ fontSize: 76, lineHeight: 82 }}
          >
            {tempDisplay}
          </Text>
          <Text className="text-base text-md-on-surface font-semibold tracking-tight opacity-90">
            {weatherInfo.description}
          </Text>
        </View>
        <View className="h-20 w-20 items-center justify-center rounded-[26px] border border-glass-border bg-md-primary/12">
          <WeatherIcon weatherCode={data.weatherCode} size={46} />
        </View>
      </View>

      {/* 統計 Bento Grid - 2x2 */}
      <View className="flex-row flex-wrap gap-3">
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

      <Text className="pl-1 text-sm font-medium text-md-on-surface-variant">
        最後更新：{formatTime(data.timestamp)}
      </Text>
    </View>
  );
});
