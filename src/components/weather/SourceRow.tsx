import React from 'react';
import { Text, View } from 'react-native';

import { SOURCE_META_MAP } from '@/api/sources';
import { SourceReading, WeatherSource } from '@/api/types';
import { formatTime } from '@/utils/date';

export interface SourceRowProps {
  source: WeatherSource;
  /** 各來源的原始溫度。聚合模式下用來顯示分歧；空陣列則只顯示來源名稱。 */
  readings?: readonly SourceReading[] | undefined;
  enabledSources?: readonly WeatherSource[] | undefined;
  timestamp: string;
}

function sourceLabel(source: WeatherSource): string {
  return source === 'aggregate' ? '聚合' : (SOURCE_META_MAP[source]?.label ?? source);
}

/**
 * 資料來源列。
 *
 * 刻意放在天氣卡「外面」、逐時預報「上面」：它是註腳而非主資訊，但又必須緊跟
 * 著它所描述的那批數字。同一列同時交代「哪來的」與「什麼時候的」—— 這兩件事
 * 語意本來就同一組，拆到卡片的右上角與左下角等於把一句話切成兩半。
 *
 * 聚合模式下把各來源的原始溫度掛在名稱後面。多來源聚合是這個 app 的核心特色，
 * 若只顯示一個「聚合」標籤，CWA 說 27°、Open-Meteo 說 30° 這件事就完全隱形，
 * 使用者不會知道畫面上的 28° 背後有 3 度的分歧。
 */
export const SourceRow = React.memo(function SourceRow({
  source,
  readings,
  enabledSources,
  timestamp,
}: SourceRowProps): React.ReactElement {
  const isAggregate = source === 'aggregate';

  // 有原始讀數就顯示分歧值，否則退回單純列出來源名稱
  const detail: string =
    readings !== undefined && readings.length > 0
      ? readings.map((r) => `${sourceLabel(r.source)} ${Math.round(r.temperature)}°`).join('  ·  ')
      : isAggregate && enabledSources !== undefined
        ? enabledSources.map(sourceLabel).join('  ·  ')
        : sourceLabel(source);

  return (
    <View className="mt-3 flex-row items-center gap-1.5 px-1">
      {isAggregate ? (
        <View className="rounded-full bg-md-primary/28 px-2 py-0.5">
          <Text className="text-[9px] text-md-on-surface">聚合</Text>
        </View>
      ) : null}
      <Text className="flex-1 text-[10px] text-md-on-surface/75" numberOfLines={1}>
        {detail}
      </Text>
      <Text className="text-[10px] text-md-on-surface-variant/55">{formatTime(timestamp)}</Text>
    </View>
  );
});
