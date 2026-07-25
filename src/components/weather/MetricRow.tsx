import React from 'react';
import { Text, View } from 'react-native';

import { AppIcon } from '@/components/icons/AppIcon';
import { StatIcon, type StatIconType } from '@/components/icons/StatIcon';
import { MetricScale } from '@/components/ui/MetricScale';
import { humidityScale, uvScale, windScale, type MetricScaleResult } from '@/utils/metric-scale';
import { formatWindSpeed } from '@/utils/unit-conversion';

const ICON_COLOR = '#9ec5ff';
const ICON_SIZE = 14;

export interface MetricRowProps {
  humidity: number;
  windSpeed: number;
  precipitationProbability: number | undefined;
  precipitation: number;
  uvIndex: number | undefined;
  /**
   * `uvIndex` 是當日最高值而非此刻的值。
   *
   * 沒有任何來源提供「當前」UV（CWA 的 current 沒這個欄位，Open-Meteo 也只有
   * daily 的 uvIndexMax），所以實務上這格填的都是日最高。標籤必須說出來 ——
   * 晚上十一點顯示「UV 9」而不註明是當日尖峰，就是在報一個假的即時值。
   */
  uvIsDailyMax?: boolean;
}

/**
 * 一格指標。四格皆為四行：圖示 / 主值 / 第三列 / 標籤。
 *
 * 第三列可以是刻度條或補充數值（降水格的雨量）。兩者高度一致，四格的標籤
 * 基線才會對齊 —— 若某格多一列或少一列，整排底線就歪了。
 */
function Metric({
  icon,
  value,
  label,
  scale,
  sub,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  scale?: MetricScaleResult;
  sub?: string;
}): React.ReactElement {
  // 刻度條是視覺化的「這算高還是低」，螢幕報讀器看不到它 —— 若不把分級名稱
  // 唸出來，報讀器使用者只會聽到「74%」，而那正是刻度條存在的理由。
  // 整格宣告為單一 a11y 節點，避免圖示、數字、標籤被逐一唸成三段。
  const a11yLabel = [label, value, scale?.level, sub].filter(Boolean).join('，');

  return (
    <View
      className="flex-1 items-center px-0.5"
      accessible
      accessibilityRole="text"
      accessibilityLabel={a11yLabel}
    >
      {icon}
      <Text className="mt-1 text-[14px] font-medium text-md-on-surface">{value}</Text>
      {scale !== undefined ? (
        <MetricScale scale={scale} />
      ) : (
        <Text className="mt-1.5 h-[3px] text-[9px] font-medium leading-[3px] text-md-on-surface/78">
          {sub ?? ''}
        </Text>
      )}
      <Text className="mt-[5px] text-[8px] text-md-on-surface-variant/68">{label}</Text>
    </View>
  );
}

function Divider(): React.ReactElement {
  return <View className="w-px bg-white/[0.14]" />;
}

function statIcon(type: StatIconType): React.ReactElement {
  return <StatIcon type={type} size={ICON_SIZE} color={ICON_COLOR} />;
}

/**
 * 當前天氣的四格指標列。
 *
 * 降水格刻意沒有刻度：百分比的機率直覺人人都有，加刻度是冗餘。空出來的那一列
 * 剛好給雨量數值，四格行數因此統一。詳見 `src/utils/metric-scale.ts`。
 */
export const MetricRow = React.memo(function MetricRow({
  humidity,
  windSpeed,
  precipitationProbability,
  precipitation,
  uvIndex,
  uvIsDailyMax,
}: MetricRowProps): React.ReactElement {
  return (
    <View className="mt-4 flex-row border-t border-white/[0.16] pt-3">
      <Metric
        icon={statIcon('humidity')}
        value={`${Math.round(humidity)}%`}
        label="濕度"
        scale={humidityScale(humidity)}
      />
      <Divider />
      <Metric
        icon={statIcon('wind')}
        value={formatWindSpeed(windSpeed, 'kmh').replace(' km/h', '')}
        label="km/h"
        scale={windScale(windSpeed)}
      />
      <Divider />
      <Metric
        icon={<AppIcon name="rainy-outline" size={ICON_SIZE} color={ICON_COLOR} />}
        value={
          precipitationProbability !== undefined ? `${Math.round(precipitationProbability)}%` : '—'
        }
        label="降水"
        sub={`${precipitation.toFixed(1)} mm`}
      />
      {/*
        UV 缺值時整格不渲染，而非顯示破折號。
        一個永遠沒有數字的欄位比少一個欄位更糟 —— 它佔著版面、每次都要被眼睛
        掃過一次，卻從不回答任何問題。剩下的格子由 flex 自動撐開。

        來源沒有「當前 UV」這個欄位，填進來的是每日預報的 uvIndexMax，
        所以標籤要標明是日最高，不能讓它冒充即時值。
      */}
      {uvIndex !== undefined ? (
        <>
          <Divider />
          <Metric
            icon={<AppIcon name="partly-sunny-outline" size={ICON_SIZE} color={ICON_COLOR} />}
            value={`${Math.round(uvIndex)}`}
            label={uvIsDailyMax === true ? 'UV 最高' : 'UV'}
            scale={uvScale(uvIndex)}
          />
        </>
      ) : null}
    </View>
  );
});
