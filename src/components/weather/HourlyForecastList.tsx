import React, { useCallback, useMemo } from 'react';
import { FlatList, ListRenderItem, Platform, Pressable, Text, View } from 'react-native';

import { HourlyForecast } from '../../api/types';
import { formatHourShort } from '../../utils/date';
import { SectionLabel } from '../ui/SectionLabel';
import { getGlassStyle } from '../ui/glass';
import { findNowIndex } from '../../utils/hourly';
import { WeatherIcon } from '../icons/WeatherIcon';

export interface HourlyForecastListProps {
  forecasts: readonly HourlyForecast[];
  /**
   * 完整逐時的總筆數，用於「全部 N 小時」的標示。
   * 首頁傳入的是精簡窗口，這個數字才是「全部」的真實量。省略時以 forecasts 長度為準。
   */
  totalCount?: number | undefined;
  /** 傳入時標題變成可點的下鑽入口（完整逐時預報頁） */
  onSeeAll?: (() => void) | undefined;
}

/** w-[43px] + gap-1px。「現在」那格較寬，getItemLayout 因此只是近似值。 */
const ITEM_WIDTH = 44;

/**
 * 過去時段的不透明度梯度。
 *
 * 時間軸不用分隔線表示，改用亮度：越舊越暗。梯度本身就讀得出方向，而且不會像
 * 一條線那樣把「過去」與「未來」切成兩個互不相干的區塊 —— 時間是連續的。
 * 距離「現在」越遠越暗，最多退到 0.32。
 */
const PAST_OPACITY_MIN = 0.32;
const PAST_OPACITY_MAX = 0.6;

function pastOpacity(distanceFromNow: number, totalPast: number): number {
  if (totalPast <= 1) return PAST_OPACITY_MAX;
  const t = (totalPast - distanceFromNow) / totalPast;
  return PAST_OPACITY_MIN + (PAST_OPACITY_MAX - PAST_OPACITY_MIN) * t;
}

interface HourlyItemProps {
  item: HourlyForecast;
  isNow: boolean;
  isPast: boolean;
  opacity: number;
  /** 跨日時顯示的日期標記（如 7/24），同日則為 null */
  dayMark: string | null;
}

const HourlyItem = React.memo(
  ({ item, isNow, isPast, opacity, dayMark }: HourlyItemProps): React.ReactElement => {
    // 過去時段的降雨條轉白 —— 彩色保留給「尚未發生」，是亮度之外的第二層線索
    const barColor = isPast || isNow ? 'bg-white' : 'bg-md-primary';
    const trackColor = isPast ? 'bg-white/25' : isNow ? 'bg-white/30' : 'bg-white/20';

    return (
      <View
        className={`items-center py-1.5 ${
          isNow ? 'rounded-[14px] border-t border-white/[0.42] bg-white/[0.26]' : ''
        }`}
        style={{ width: isNow ? 50 : 43, opacity }}
      >
        {dayMark !== null ? (
          <Text className="-mb-px text-[8px] font-medium text-md-on-surface-variant/55">
            {dayMark}
          </Text>
        ) : null}
        <Text
          className={`text-[9px] ${
            isNow || isPast ? 'font-medium text-md-on-surface' : 'text-md-on-surface/78'
          }`}
        >
          {isNow ? '現在' : formatHourShort(item.timestamp)}
        </Text>
        <WeatherIcon weatherCode={item.weatherCode} size={isNow ? 18 : 17} />
        <Text
          className="mt-0.5 font-medium text-md-on-surface"
          style={{ fontSize: isNow ? 14 : 12 }}
        >
          {Math.round(item.temperature)}°
        </Text>
        <View
          className={`mt-1.5 h-[3px] overflow-hidden rounded-[3px] ${trackColor}`}
          style={{ width: isNow ? 22 : 20 }}
        >
          <View
            className={`h-[3px] rounded-[3px] ${barColor}`}
            style={{ width: `${Math.min(100, Math.max(0, item.precipitationProbability))}%` }}
          />
        </View>
        <Text
          className={`mt-0.5 text-[8px] ${
            isNow || isPast ? 'font-medium text-md-on-surface' : 'text-md-on-surface-variant/75'
          }`}
        >
          {Math.round(item.precipitationProbability)}%
        </Text>
      </View>
    );
  },
);

/**
 * 逐時預報。
 *
 * **顯示筆數完全由後端決定** —— 這裡不做任何截斷。後端給 24 筆就顯示 24 筆，
 * 給 168 筆就顯示 168 筆。先前寫死的 `slice(0, 24)` 會把 Open-Meteo 回傳的
 * 7 天資料砍掉 144 筆。
 *
 * 過去時段（`isPast`）目前後端尚未提供 —— proxy 的 hourly 端點無 `past_hours`
 * 參數。無過去資料時時間軸自然從「現在」開始，這就是 fallback，不需要特別分支。
 */
export const HourlyForecastList = React.memo(function HourlyForecastList({
  forecasts,
  totalCount,
  onSeeAll,
}: HourlyForecastListProps): React.ReactElement {
  const seeAllCount = totalCount ?? forecasts.length;
  const now = Date.now();

  const meta = useMemo(() => {
    const nowIndex = findNowIndex(forecasts, now);

    let prevDay: string | null = null;
    const dayMarks = forecasts.map((f, index) => {
      const date = new Date(f.timestamp);
      const key = `${date.getMonth() + 1}/${date.getDate()}`;
      // 第一筆不標日期 —— 使用者知道現在是今天
      const mark = index > 0 && key !== prevDay ? key : null;
      prevDay = key;
      return mark;
    });

    return { nowIndex, dayMarks };
  }, [forecasts, now]);

  const renderItem: ListRenderItem<HourlyForecast> = useCallback(
    ({ item, index }) => {
      const isNow = index === meta.nowIndex;
      const isPast = index < meta.nowIndex;
      return (
        <HourlyItem
          item={item}
          isNow={isNow}
          isPast={isPast}
          opacity={isPast ? pastOpacity(meta.nowIndex - index, meta.nowIndex) : 1}
          dayMark={meta.dayMarks[index] ?? null}
        />
      );
    },
    [meta],
  );

  const keyExtractor = useCallback((item: HourlyForecast) => item.timestamp, []);

  const getItemLayout = useCallback(
    (_: ArrayLike<HourlyForecast> | null | undefined, index: number) => ({
      length: ITEM_WIDTH,
      offset: ITEM_WIDTH * index,
      index,
    }),
    [],
  );

  if (forecasts.length === 0) {
    return (
      <View className="gap-2">
        <SectionLabel>逐時預報</SectionLabel>
        <View
          className="mx-4 items-center justify-center rounded-[18px] border border-white/20 bg-white/12 p-4"
          style={getGlassStyle(16)}
        >
          <Text className="text-sm text-md-on-surface-variant">無逐時預報資料</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="gap-2">
      {onSeeAll !== undefined ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`查看完整逐時預報，共 ${seeAllCount} 小時`}
          onPress={onSeeAll}
          className="flex-row items-center justify-between px-4"
        >
          <SectionLabel>逐時預報</SectionLabel>
          <Text className="text-[9px] text-md-on-surface-variant/70">
            全部 {seeAllCount} 小時 ›
          </Text>
        </Pressable>
      ) : (
        <SectionLabel>逐時預報</SectionLabel>
      )}
      <View
        className="mx-4 overflow-hidden rounded-[18px] border border-white/20 bg-white/12"
        style={getGlassStyle(16)}
      >
        <FlatList
          data={forecasts}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          getItemLayout={getItemLayout}
          // 掛載時定位到「現在」，讓過去時段落在左側視窗外，需要時往左滑
          initialScrollIndex={meta.nowIndex}
          horizontal
          showsHorizontalScrollIndicator={Platform.OS === 'web'}
          scrollEventThrottle={16}
          removeClippedSubviews
          maxToRenderPerBatch={8}
          windowSize={5}
          initialNumToRender={8}
          contentContainerStyle={{ paddingHorizontal: 6, gap: 1, paddingVertical: 5 }}
        />
      </View>
    </View>
  );
});
