import React from 'react';
import { Text, View } from 'react-native';

import { AGGREGATE_BADGE_CLASS, SOURCE_META_MAP } from '@/api/sources';
import { WeatherSource } from '../../api/types';

export interface SourceBadgeProps {
  source: WeatherSource;
}

const FALLBACK_INFO = {
  label: '未知',
  className: 'border-white/20 bg-white/10',
};

const AGGREGATE_INFO = {
  label: '聚合',
  className: AGGREGATE_BADGE_CLASS,
};

export const SourceBadge = React.memo(function SourceBadge({
  source,
}: SourceBadgeProps): React.ReactElement {
  const sourceMeta =
    source === 'aggregate'
      ? AGGREGATE_INFO
      : SOURCE_META_MAP[source] !== undefined
        ? {
            label: SOURCE_META_MAP[source].label,
            className: SOURCE_META_MAP[source].badgeClassName,
          }
        : FALLBACK_INFO;
  const info = sourceMeta;

  return (
    <View className={`${info.className} rounded-full border px-2.5 py-1`}>
      <Text
        className="text-md-on-surface"
        style={{ fontSize: 11, fontWeight: '700', letterSpacing: 0.2 }}
      >
        {info.label}
      </Text>
    </View>
  );
});
