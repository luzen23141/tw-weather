import React, { useMemo, useRef } from 'react';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';

import { getGlassStyle } from '@/components/ui/glass';
import { WeatherIcon } from '@/components/icons/WeatherIcon';
import { getDayOfWeek } from '@/utils/date';

/** 每格寬 48 + gap 2 */
const ITEM_WIDTH = 50;

export interface DayStripItem {
  date: string;
  weatherCode: number;
  tempMax: number;
  tempMin: number;
}

export interface DayStripProps {
  days: readonly DayStripItem[];
  selectedDate: string;
  onSelect: (date: string) => void;
}

interface CellProps {
  item: DayStripItem;
  isSelected: boolean;
  /** 跨月時顯示的月份標記，同月則為 null */
  monthMark: string | null;
  onSelect: (date: string) => void;
}

const Cell = React.memo(({ item, isSelected, monthMark, onSelect }: CellProps) => {
  const date = new Date(item.date);
  const day = date.getDate();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      accessibilityLabel={`${date.getMonth() + 1} 月 ${day} 日，最高 ${Math.round(item.tempMax)} 度`}
      onPress={() => {
        onSelect(item.date);
      }}
      className={`items-center py-1.5 ${
        isSelected ? 'rounded-[14px] border-t border-white/[0.42] bg-white/[0.26]' : ''
      }`}
      style={{ width: 48 }}
    >
      {monthMark !== null ? (
        <Text className="-mb-px text-[8px] font-medium text-md-on-surface-variant/55">
          {monthMark}
        </Text>
      ) : null}
      <Text
        className={`text-[9px] ${
          isSelected ? 'font-medium text-md-on-surface' : 'text-md-on-surface/78'
        }`}
      >
        {getDayOfWeek(item.date)}
      </Text>
      <Text
        className="font-medium text-md-on-surface"
        style={{ fontSize: isSelected ? 15 : 13, marginTop: 1 }}
      >
        {day}
      </Text>
      <WeatherIcon weatherCode={item.weatherCode} size={16} />
      <Text className="mt-0.5 text-[10px] font-medium text-md-on-surface">
        {Math.round(item.tempMax)}°
      </Text>
      <Text className="text-[9px] text-md-on-surface-variant/72">{Math.round(item.tempMin)}°</Text>
    </Pressable>
  );
});

/**
 * 橫向日期選擇條。
 *
 * 歷史範圍拉到 92 天之後，原本只顯示 `MM/DD` 的格子完全不夠用 —— 九十幾個
 * 一模一樣的數字，使用者無從判斷該往哪滑。每格因此帶上星期、天氣圖示與高低溫：
 * 這些既是選擇的線索，本身也是可掃視的趨勢（連續幾天的圖示與溫度變化一眼看得出來）。
 *
 * 跨月時在該格上方標月份，取代固定的月份分區標題 —— 與逐時預報的跨日標記
 * 同一套做法，不另外插入會打斷連續性的分隔元素。
 */
export const DayStrip = React.memo(function DayStrip({
  days,
  selectedDate,
  onSelect,
}: DayStripProps): React.ReactElement | null {
  const monthMarks = useMemo(() => {
    let prevMonth: number | null = null;
    return days.map((d, index) => {
      const month = new Date(d.date).getMonth() + 1;
      const mark = index > 0 && month !== prevMonth ? `${month}月` : null;
      prevMonth = month;
      return mark;
    });
  }, [days]);

  const selectedIndex = useMemo(
    () =>
      Math.max(
        0,
        days.findIndex((d) => d.date === selectedDate),
      ),
    [days, selectedDate],
  );

  const scrollRef = useRef<ScrollView>(null);

  if (days.length === 0) return null;

  return (
    <View
      className="mx-4 overflow-hidden rounded-[18px] border border-white/20 bg-white/12"
      style={getGlassStyle(16)}
    >
      {/*
        用 ScrollView + map 而非 FlatList。

        FlatList 在 web 上的虛擬化會裁掉不在初始視窗內的項目 —— 當項目少到塞不滿
        螢幕、initialScrollIndex 又指向最後一格時，第一格會被錯誤裁掉（歷史只剩兩天
        時，前一天整個消失）。日期條頂多幾十格、格子又小，不需要虛擬化。
      */}
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={Platform.OS === 'web'}
        contentOffset={{ x: Math.max(0, (selectedIndex - 3) * ITEM_WIDTH), y: 0 }}
        contentContainerStyle={{ paddingHorizontal: 6, gap: 2, paddingVertical: 5 }}
      >
        {days.map((item, index) => (
          <Cell
            key={item.date}
            item={item}
            isSelected={item.date === selectedDate}
            monthMark={monthMarks[index] ?? null}
            onSelect={onSelect}
          />
        ))}
      </ScrollView>
    </View>
  );
});
