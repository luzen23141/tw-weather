import React from 'react';
import { Text, View } from 'react-native';

import { CurrentWeather, Location, WeatherSource } from '../../api/types';
import { formatTime } from '../../utils/date';
import { getGlassStyle } from '../../utils/glass';
import { formatWindSpeed } from '../../utils/unit-conversion';
import { getWeatherCodeInfo } from '../../utils/weather-code';
import { StatIcon, StatIconType } from '../icons/StatIcon';
import { WeatherIcon } from '../icons/WeatherIcon';
import { SourceBadge } from '../ui/SourceBadge';

import { formatLocationSecondaryName } from '@/utils/location-display';

export interface CurrentWeatherCardProps {
  data: CurrentWeather;
  location: Location;
  source: WeatherSource;
}

const StatCard = ({
  iconType,
  label,
  value,
  iconColor,
}: {
  iconType: StatIconType;
  label: string;
  value: string;
  iconColor: string;
}) => (
  <View
    style={[{ width: '48%' }, getGlassStyle(16)]}
    className="rounded-3xl border border-glass-border-strong bg-md-surface-container px-4 py-4 gap-2"
  >
    <View className="flex-row items-center gap-1.5">
      <StatIcon type={iconType} size={16} color={iconColor} />
      <Text className="text-xs font-medium text-md-on-surface-variant">{label}</Text>
    </View>
    <Text className="text-lg font-bold text-md-on-surface">{value}</Text>
  </View>
);

export const CurrentWeatherCard = React.memo(function CurrentWeatherCard({
  data,
  location,
  source,
}: CurrentWeatherCardProps): React.ReactElement {
  const weatherInfo = getWeatherCodeInfo(data.weatherCode);
  const isRangeTemp = typeof data.temperature === 'string';
  const tempDisplay = isRangeTemp ? data.temperature : `${Math.round(data.temperature)}°`;
  const secondaryLocationText = formatLocationSecondaryName(location);

  return (
    <View
      className="mx-4 rounded-[28px] border border-glass-border-strong bg-md-surface-container px-6 py-6 gap-6 shadow-glass"
      style={getGlassStyle(24)}
    >
      {/* 頂部：城市 + Badge */}
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <Text className="text-lg font-bold text-md-on-surface tracking-tight">
            {location.name}
          </Text>
          {secondaryLocationText && (
            <Text className="text-xs text-md-on-surface-variant mt-1 font-medium">
              {secondaryLocationText}
            </Text>
          )}
        </View>
        <SourceBadge source={source} />
      </View>

      {/* 溫度 + 天氣圖示 */}
      <View className="items-center py-1 gap-2">
        <Text
          className="font-bold text-md-on-surface text-center tracking-tighter"
          style={{ fontSize: 76, lineHeight: 82 }}
        >
          {tempDisplay}
        </Text>
        <View className="h-16 w-16 items-center justify-center rounded-full bg-md-primary/12">
          <WeatherIcon weatherCode={data.weatherCode} size={38} />
        </View>
        <Text className="text-base text-md-on-surface font-semibold tracking-tight opacity-90">
          {weatherInfo.description}
        </Text>
      </View>

      {/* 統計 Bento Grid - 2x2 */}
      <View className="flex-row flex-wrap gap-3">
        <StatCard
          iconType="thermometer"
          label="體感溫度"
          value={`${Math.round(data.apparentTemperature ?? data.temperature)}°`}
          iconColor="var(--color-md-outline)"
        />
        <StatCard
          iconType="humidity"
          label="濕度"
          value={`${Math.round(data.humidity ?? 0)}%`}
          iconColor="var(--color-md-outline)"
        />
        <StatCard
          iconType="wind"
          label="風速"
          value={formatWindSpeed(data.windSpeed ?? 0, 'kmh')}
          iconColor="var(--color-md-outline)"
        />
        <StatCard
          iconType="precipitation"
          label="降水量"
          value={`${(data.precipitation ?? 0).toFixed(1)} mm`}
          iconColor="var(--color-md-outline)"
        />
      </View>

      {/* 最後更新時間 */}
      <Text className="text-sm text-md-on-surface-variant font-medium text-center">
        最後更新：{formatTime(data.timestamp)}
      </Text>
    </View>
  );
});
