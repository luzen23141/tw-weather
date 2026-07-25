import React from 'react';
import { Text, View } from 'react-native';

import { getGlassStyle } from '@/components/ui/glass';
import { WeatherIcon } from '@/components/icons/WeatherIcon';
import { formatDate, getWeekdayName } from '@/utils/date';
import type { DayDetailData } from '@/utils/day-detail';

export interface DayDetailCardProps {
  detail: DayDetailData;
  /** 相對於今天的天數：負為過去、0 為今天、正為未來。用於補一句時間脈絡。 */
  offsetDays?: number;
}

function relativeText(offsetDays: number | undefined, isObservation: boolean): string | null {
  if (offsetDays === undefined) return null;
  if (offsetDays === 0) return '今天';
  if (offsetDays === -1) return '昨天';
  if (offsetDays === 1) return '明天';
  if (offsetDays < 0) return `${Math.abs(offsetDays)} 天前${isObservation ? '的觀測' : ''}`;
  return `${offsetDays} 天後`;
}

/**
 * 單日詳情卡。
 *
 * 由歷史頁與 /day/[date] 共用 —— 資料先經 `day-detail.ts` 正規化，這裡不需要
 * 知道自己拿到的是觀測還是預報，只有 `isObservation` 影響標示與語氣。
 *
 * 沿用首頁的視覺語言：單層玻璃、圖示與溫度並置、指標以細分隔線分格。
 */
export const DayDetailCard = React.memo(function DayDetailCard({
  detail,
  offsetDays,
}: DayDetailCardProps): React.ReactElement {
  const relative = relativeText(offsetDays, detail.isObservation);

  return (
    <View
      className="mx-4 overflow-hidden rounded-[22px] border border-white/[0.22] bg-white/[0.14] px-3.5 py-4"
      style={getGlassStyle(20)}
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <Text className="text-[17px] font-medium text-md-on-surface">
            {formatDate(detail.date)}
          </Text>
          <Text className="mt-0.5 text-[10px] text-md-on-surface-variant/70">
            {getWeekdayName(detail.date)}
            {relative !== null ? ` · ${relative}` : ''}
          </Text>
        </View>
        <View
          className={`rounded-full px-2 py-0.5 ${
            detail.isObservation ? 'bg-white/[0.18]' : 'bg-md-primary/28'
          }`}
        >
          <Text className="text-[9px] text-md-on-surface">
            {detail.isObservation ? '實際觀測' : '預報'}
          </Text>
        </View>
      </View>

      <View className="mt-4 flex-row items-center gap-3">
        <WeatherIcon weatherCode={detail.weatherCode} size={48} />
        <View>
          <View className="flex-row items-baseline gap-2">
            <Text
              className="font-medium text-md-on-surface"
              style={{ fontSize: 44, lineHeight: 42, letterSpacing: -1.5 }}
            >
              {Math.round(detail.tempMax)}°
            </Text>
            <Text className="text-[20px] font-medium text-md-on-surface-variant/72">
              {Math.round(detail.tempMin)}°
            </Text>
          </View>
          <Text className="mt-2 text-[13px] text-md-on-surface">{detail.description}</Text>
        </View>
      </View>

      <View className="mt-4 flex-row flex-wrap border-t border-white/[0.16] pt-3">
        {detail.metrics.map((metric, index) => (
          <React.Fragment key={metric.key}>
            {index > 0 ? <View className="w-px bg-white/[0.14]" /> : null}
            <View className="flex-1 items-center px-0.5" style={{ minWidth: 56 }}>
              <Text className="text-[14px] font-medium text-md-on-surface">{metric.value}</Text>
              <Text className="mt-1 text-center text-[8px] text-md-on-surface-variant/68">
                {metric.label}
              </Text>
            </View>
          </React.Fragment>
        ))}
      </View>
    </View>
  );
});
