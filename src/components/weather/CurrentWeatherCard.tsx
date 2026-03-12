import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { Text, View } from 'react-native';

import { CurrentWeather, Location, WeatherSource } from '../../api/types';
import { useMDColors } from '../../hooks/useMDColors';
import { formatTime } from '../../utils/date';
import { getGlassStyle } from '../../utils/glass';
import { formatWindSpeed } from '../../utils/unit-conversion';
import { getWeatherCodeInfo } from '../../utils/weather-code';
import { SourceBadge } from '../ui/SourceBadge';

import { formatLocationSecondaryName } from '@/utils/location-display';

export interface CurrentWeatherCardProps {
  data: CurrentWeather;
  location: Location;
  source: WeatherSource;
}

const StatCard = ({
  icon,
  label,
  value,
  iconColor,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  iconColor: string;
}) => (
  <View
    style={[{ width: '48%' }, getGlassStyle(16)]}
    className="rounded-3xl border border-glass-border-strong bg-md-surface-container px-4 py-4 gap-2"
  >
    <View className="flex-row items-center gap-1.5">
      <Ionicons name={icon} size={14} color={iconColor} />
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
  const colors = useMDColors();
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
          <Ionicons name={weatherInfo.icon} size={30} color={colors.primary} />
        </View>
        <Text className="text-base text-md-on-surface font-semibold tracking-tight opacity-90">
          {weatherInfo.description}
        </Text>
      </View>

      {/* 統計 Bento Grid - 2x2 */}
      <View className="flex-row flex-wrap gap-3">
        <StatCard
          icon="thermometer-outline"
          label="體感溫度"
          value={`${Math.round(data.apparentTemperature ?? data.temperature)}°`}
          iconColor={colors.outline}
        />
        <StatCard
          icon="water-outline"
          label="濕度"
          value={`${Math.round(data.humidity ?? 0)}%`}
          iconColor={colors.outline}
        />
        <StatCard
          icon="speedometer-outline"
          label="風速"
          value={formatWindSpeed(data.windSpeed ?? 0, 'kmh')}
          iconColor={colors.outline}
        />
        <StatCard
          icon="rainy-outline"
          label="降水量"
          value={`${(data.precipitation ?? 0).toFixed(1)} mm`}
          iconColor={colors.outline}
        />
      </View>

      {/* 最後更新時間 */}
      <Text className="text-sm text-md-on-surface-variant font-medium text-center">
        最後更新：{formatTime(data.timestamp)}
      </Text>
    </View>
  );
});
