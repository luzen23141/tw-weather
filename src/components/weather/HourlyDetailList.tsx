import React, { useMemo } from 'react';
import { Text, View } from 'react-native';

import { AppIcon } from '@/components/icons/AppIcon';
import { WeatherIcon } from '@/components/icons/WeatherIcon';
import { getGlassStyle } from '@/components/ui/glass';
import { HourlyForecast } from '@/api/types';
import { formatDate, formatHourShort } from '@/utils/date';
import { upcomingHours } from '@/utils/hourly';

export interface HourlyDetailListProps {
  forecasts: readonly HourlyForecast[];
}

interface DaySection {
  title: string;
  data: HourlyForecast[];
}

function localDateKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

/**
 * 完整逐時預報（垂直）。
 *
 * 首頁的橫向逐時條一格只有 43px，塞得下時間、圖示、溫度、降雨機率就滿了。
 * 專屬頁面改成垂直列，同樣的高度可以多帶體感、風速與降水量 —— 這是「下鑽」
 * 該提供的增量，而不是把同一份資訊換個方向再畫一次。
 *
 * 依日分段，因為後端可能回傳 168 小時（7 天）；沒有分段的話使用者捲到一半
 * 就不知道自己在看哪一天。
 */
export const HourlyDetailList = React.memo(function HourlyDetailList({
  forecasts,
}: HourlyDetailListProps): React.ReactElement {
  // 只顯示「現在」之後的時段。首頁的橫向條已經涵蓋剛過去的幾小時；專屬的預報頁
  // 是回答「接下來會怎樣」，讓使用者先捲過二十列已經發生的事沒有意義。
  const upcoming = useMemo(() => upcomingHours(forecasts), [forecasts]);

  const sections = useMemo<DaySection[]>(() => {
    const byDay = new Map<string, HourlyForecast[]>();
    for (const item of upcoming) {
      const key = localDateKey(item.timestamp);
      const bucket = byDay.get(key);
      if (bucket === undefined) byDay.set(key, [item]);
      else bucket.push(item);
    }

    return Array.from(byDay.values())
      .filter((data) => data.length > 0)
      .map((data) => ({
        // 以該段第一筆的時間當標題來源，避免自己拼日期字串又要處理時區
        title: formatDate(data[0]?.timestamp ?? ''),
        data,
      }));
  }, [upcoming]);

  const nowTimestamp = upcoming[0]?.timestamp;

  if (sections.length === 0) {
    return (
      <View
        className="mx-4 items-center rounded-[18px] border border-white/20 bg-white/12 p-4"
        style={getGlassStyle(16)}
      >
        <Text className="text-sm text-md-on-surface-variant">無逐時預報資料</Text>
      </View>
    );
  }

  return (
    <View
      className="mx-4 overflow-hidden rounded-[18px] border border-white/20 bg-white/12 py-1"
      style={getGlassStyle(16)}
    >
      {/*
        刻意用 map 而非 SectionList：這個列表已經在 PageScrollView 裡面，巢狀的
        虛擬化列表會因為量不到可視高度而只渲染前幾筆（實測停在第 9 列）。
        168 列的純 View 對 RN 來說不是問題，而巢狀虛擬化的行為問題很難除錯。
      */}
      {sections.map((section, sectionIndex) => (
        <View key={section.title}>
          <View className={`mb-1 px-6 ${sectionIndex === 0 ? 'mt-1' : 'mt-3'}`}>
            <Text className="text-[9px] tracking-[1.2px] text-md-on-surface-variant/70">
              {section.title}
            </Text>
          </View>

          {section.data.map((item, index) => {
            const isNow = item.timestamp === nowTimestamp;

            return (
              <View key={item.timestamp}>
                {index > 0 ? <View className="mx-6 h-px bg-white/10" /> : null}
                <View
                  className={`mx-3 flex-row items-center gap-3 px-3 ${
                    isNow
                      ? 'rounded-[14px] border-t border-white/[0.42] bg-white/[0.26] py-2.5'
                      : 'py-2'
                  }`}
                >
                  <Text
                    className={`w-[42px] text-[12px] text-md-on-surface ${
                      isNow ? 'font-medium' : ''
                    }`}
                  >
                    {isNow ? '現在' : formatHourShort(item.timestamp)}
                  </Text>

                  <WeatherIcon weatherCode={item.weatherCode} size={20} />

                  <View className="w-[52px]">
                    <Text className="text-[15px] font-medium text-md-on-surface">
                      {Math.round(item.temperature)}°
                    </Text>
                    <Text className="text-[9px] text-md-on-surface-variant/70">
                      體感 {Math.round(item.apparentTemperature)}°
                    </Text>
                  </View>

                  <View className="w-[46px] flex-row items-center gap-1">
                    <AppIcon name="water" size={9} color="#9ec5ff" />
                    <Text className="text-[11px] text-md-primary">
                      {Math.round(item.precipitationProbability)}%
                    </Text>
                  </View>

                  <View className="flex-1 items-end">
                    <Text className="text-[11px] text-md-on-surface-variant/80">
                      {Math.round(item.windSpeed)} km/h
                    </Text>
                    {item.precipitation > 0 ? (
                      <Text className="text-[9px] text-md-on-surface-variant/70">
                        {item.precipitation.toFixed(1)} mm
                      </Text>
                    ) : null}
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
});
