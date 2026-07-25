import React from 'react';
import { Text, View } from 'react-native';

import { AppIcon } from '@/components/icons/AppIcon';
import { getGlassStyle } from '@/components/ui/glass';
import type { RainSummary } from '@/utils/rain-summary';

export interface RainSummaryNoteProps {
  summary: RainSummary;
}

/**
 * 降雨時段摘要。
 *
 * 有雨時用強調樣式（藍調底 + 彩色圖示），無雨時退為低調確認（中性底 + 白圖示）。
 * 無雨的情況刻意不隱藏 —— 「沒有雨」本身就是使用者想確認的答案，只是不該用
 * 跟「要下雨了」同樣的音量說出來。
 */
export const RainSummaryNote = React.memo(function RainSummaryNote({
  summary,
}: RainSummaryNoteProps): React.ReactElement {
  const { raining, text } = summary;

  return (
    <View
      className={`mt-3 flex-row items-center gap-2 rounded-[16px] border px-3 py-2.5 ${
        raining ? 'border-md-primary/30 bg-md-primary/16' : 'border-white/[0.16] bg-white/10'
      }`}
      style={getGlassStyle(16)}
      accessibilityRole="text"
    >
      <AppIcon
        name={raining ? 'rainy-outline' : 'partly-sunny-outline'}
        size={17}
        color={raining ? '#9ec5ff' : 'rgba(255,255,255,0.8)'}
      />
      <Text
        className={`flex-1 text-[12px] ${raining ? 'text-md-on-surface' : 'text-md-on-surface/85'}`}
      >
        {text}
      </Text>
    </View>
  );
});
