import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';

import { CurrentWeather, Location, WeatherSource } from '../../api/types';
import { useMDColors } from '../../hooks/useMDColors';
import { formatTime } from '../../utils/date';
import { getGlassStyle } from '../../utils/glass';
import { formatWindSpeed } from '../../utils/unit-conversion';
import { getWeatherCodeInfo } from '../../utils/weather-code';
import { SourceBadge } from '../ui/SourceBadge';

export interface CurrentWeatherCardProps {
  data: CurrentWeather;
  location: Location;
  source: WeatherSource;
  windSpeedUnit?: 'kmh' | 'ms' | 'mph';
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
    className="bg-md-surface-variant rounded-2xl p-4 gap-2 border border-glass-border transition-all"
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
  windSpeedUnit = 'kmh',
}: CurrentWeatherCardProps): React.ReactElement {
  const colors = useMDColors();
  const weatherInfo = getWeatherCodeInfo(data.weatherCode);
  const isRangeTemp = typeof data.temperature === 'string';
  const tempDisplay = isRangeTemp ? data.temperature : `${Math.round(data.temperature)}°`;

  return (
    <View
      className="mx-4 bg-md-surface rounded-[28px] p-6 gap-6 shadow-glass border border-glass-border"
      style={getGlassStyle(24)}
    >
      {/* 頂部：城市 + Badge */}
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <Text className="text-lg font-bold text-md-on-surface tracking-tight">
            {location.name}
          </Text>
          {location.city && (
            <Text className="text-xs text-md-on-surface-variant mt-1 font-medium">
              {location.city}
              {location.district ? ` · ${location.district}` : ''}
            </Text>
          )}
        </View>
        <SourceBadge source={source} />
      </View>

      {/* 溫度 + 天氣圖示 */}
      <View className="items-center py-2 gap-1">
        <Text
          className="font-bold text-md-on-surface text-center tracking-tighter"
          style={{ fontSize: 88, lineHeight: 96 }}
        >
          {tempDisplay}
        </Text>
        <Text style={{ fontSize: 56 }}>{weatherInfo.emoji}</Text>
        <Text className="text-lg text-md-on-surface font-medium tracking-tight mt-2 opacity-90">
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
          value={formatWindSpeed(data.windSpeed ?? 0, windSpeedUnit)}
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
      <Text className="text-xs text-md-on-surface-variant font-medium text-center">
        最後更新：{formatTime(data.timestamp)}
      </Text>
    </View>
  );
});
