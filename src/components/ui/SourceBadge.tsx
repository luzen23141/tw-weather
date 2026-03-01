import React from 'react';
import { Text, View } from 'react-native';

import { WeatherSource } from '../../api/types';

export interface SourceBadgeProps {
  source: WeatherSource;
}

const SOURCE_INFO: Record<WeatherSource, { label: string; className: string }> = {
  cwa: { label: 'CWA', className: 'bg-md-primary/15 border-glass-border' },
  'open-meteo': { label: 'Open-Meteo', className: 'bg-md-tertiary/15 border-glass-border' },
  weatherapi: { label: 'WeatherAPI', className: 'bg-md-secondary/15 border-glass-border' },
  openweathermap: { label: 'OWM', className: 'bg-md-error/15 border-glass-border' },
  aggregate: { label: '聚合', className: 'bg-md-primary-container border-glass-border' },
};

const FALLBACK_INFO = {
  label: '未知',
  className: 'bg-md-surface-variant border-glass-border',
};

export const SourceBadge = React.memo(function SourceBadge({
  source,
}: SourceBadgeProps): React.ReactElement {
  const info = SOURCE_INFO[source] ?? FALLBACK_INFO;

  return (
    <View className={`${info.className} border px-2.5 py-1 rounded-full`}>
      <Text className="text-md-on-surface" style={{ fontSize: 11, fontWeight: '700' }}>
        {info.label}
      </Text>
    </View>
  );
});
