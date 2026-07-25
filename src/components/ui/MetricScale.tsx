import React from 'react';
import { View } from 'react-native';

import type { MetricScaleResult } from '@/utils/metric-scale';

export interface MetricScaleProps {
  scale: MetricScaleResult;
}

/**
 * 分段刻度條。
 *
 * 段數依各指標的實際分級而異（濕度 4 / 風速 6 / UV 5），但段寬與間距會反向
 * 調整，讓不同段數的刻度總寬都落在 38px 左右 —— 否則四格並排時底線參差。
 */
const TOTAL_WIDTH = 38;
const GAP_BY_SEGMENTS: Record<number, number> = { 4: 2, 5: 2, 6: 1.5 };
const DEFAULT_GAP = 2;

export const MetricScale = React.memo(function MetricScale({
  scale,
}: MetricScaleProps): React.ReactElement {
  const { segments, filled, warn } = scale;
  const gap = GAP_BY_SEGMENTS[segments] ?? DEFAULT_GAP;
  const segmentWidth = Math.max(3, (TOTAL_WIDTH - gap * (segments - 1)) / segments);

  return (
    // 分級資訊由外層 Metric 的 accessibilityLabel 一併唸出，這裡標為裝飾性，
    // 否則報讀器會逐一唸出每一段色塊
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      className="mt-1.5 h-[3px] flex-row justify-center"
      style={{ gap }}
    >
      {Array.from({ length: segments }, (_, index) => (
        <View
          key={index}
          className={index < filled ? (warn ? 'bg-md-warning' : 'bg-white') : 'bg-white/[0.22]'}
          style={{ width: segmentWidth, height: 3, borderRadius: 2 }}
        />
      ))}
    </View>
  );
});
