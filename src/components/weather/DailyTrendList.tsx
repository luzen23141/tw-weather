import React, { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';

import { AppIcon } from '@/components/icons/AppIcon';

import { DailyForecast, HistoricalDayWeather } from '../../api/types';
import { getDayOfWeek } from '../../utils/date';
import { SectionLabel } from '../ui/SectionLabel';
import { getGlassStyle } from '../ui/glass';
import { WeatherIcon } from '../icons/WeatherIcon';

/** 溫度區間 bar 的軸至少涵蓋這麼多度，避免全週溫差小時 bar 抖動放大 */
const MIN_AXIS_SPAN = 6;

interface TrendDay {
  key: string;
  /** 原始日期字串（YYYY-MM-DD），供下鑽路由使用 */
  date: string;
  /** 顯示名稱：昨日 / 今日 / 週五 */
  name: string;
  weatherCode: number;
  precipitationProbability: number | undefined;
  tempMin: number;
  tempMax: number;
  /** 今日的當前溫度，用於在 bar 上標點 */
  currentTemp?: number;
  isPast: boolean;
  isToday: boolean;
  /** 該列是否可點入詳情 */
  canDrillDown: boolean;
}

export interface DailyTrendListProps {
  forecasts: readonly DailyForecast[];
  /** 歷史資料，取最近一日作為「昨日」。缺少時該列不顯示。 */
  history?: readonly HistoricalDayWeather[] | undefined;
  /** 當前氣溫，標在今日那列的 bar 上 */
  currentTemperature?: number | undefined;
  title?: string;
  /**
   * 點選未來某一天的回調（導向單日詳情）。
   */
  onSelectDay?: ((date: string) => void) | undefined;
  /**
   * 點選昨日的回調（導向歷史頁）。
   *
   * 昨日來自 history、單日詳情頁只吃預報資料，所以它需要不同的去處。
   * 但它在視覺上與其他列一模一樣 —— 若不給去處，使用者點下去毫無反應，
   * 那比明確的不可點更令人困惑。
   */
  onSelectPastDay?: (() => void) | undefined;
}

function yesterdayOf(history: readonly HistoricalDayWeather[]): HistoricalDayWeather | undefined {
  // history 由 useHistory 依日期新到舊排序，第一筆即最近一日
  return history[0];
}

/**
 * 每日預報趨勢。
 *
 * 昨日 → 今日 → 未來，三段時態靠不透明度與 lens pill 區分，與逐時預報同一套
 * 視覺語言。溫度區間 bar 以**整段期間**的 min/max 為共同軸，各列的起訖位置才
 * 有可比性；若每列各自為軸，bar 長度就失去意義。
 *
 * 「昨日」來自 `useHistory`，與預報是不同的資料來源，因此可能缺席 —— 缺席時
 * 直接不顯示該列，不留空位。
 */
export const DailyTrendList = React.memo(function DailyTrendList({
  forecasts,
  history,
  currentTemperature,
  title = '每日預報',
  onSelectDay,
  onSelectPastDay,
}: DailyTrendListProps): React.ReactElement {
  const days = useMemo<TrendDay[]>(() => {
    const result: TrendDay[] = [];

    const yesterday = history !== undefined ? yesterdayOf(history) : undefined;
    if (yesterday !== undefined) {
      result.push({
        key: `history-${yesterday.date}`,
        date: yesterday.date,
        name: '昨日',
        weatherCode: yesterday.weatherCode,
        // 歷史資料只有累積雨量，沒有機率 —— 這是資料本身就缺，不要硬湊
        precipitationProbability: undefined,
        tempMin: yesterday.temperatureMin,
        tempMax: yesterday.temperatureMax,
        isPast: true,
        isToday: false,
        canDrillDown: onSelectPastDay !== undefined,
      });
    }

    forecasts.forEach((day, index) => {
      result.push({
        key: `forecast-${day.date}`,
        date: day.date,
        name: index === 0 ? '今日' : getDayOfWeek(day.date),
        weatherCode: day.weatherCode,
        precipitationProbability: day.precipitationProbability,
        tempMin: day.temperatureMin,
        tempMax: day.temperatureMax,
        ...(index === 0 && currentTemperature !== undefined
          ? { currentTemp: currentTemperature }
          : {}),
        isPast: false,
        isToday: index === 0,
        canDrillDown: onSelectDay !== undefined,
      });
    });

    return result;
  }, [forecasts, history, currentTemperature, onSelectDay, onSelectPastDay]);

  const axis = useMemo(() => {
    if (days.length === 0) return { min: 0, span: 1 };
    const min = Math.min(...days.map((d) => d.tempMin));
    const max = Math.max(...days.map((d) => d.tempMax));
    const span = Math.max(MIN_AXIS_SPAN, max - min);
    return { min, span };
  }, [days]);

  const toPercent = (value: number): number =>
    Math.min(100, Math.max(0, ((value - axis.min) / axis.span) * 100));

  if (days.length === 0) {
    return (
      <View className="gap-2">
        <SectionLabel>{title}</SectionLabel>
        <View
          className="mx-4 items-center rounded-[18px] border border-white/20 bg-white/12 p-4"
          style={getGlassStyle(16)}
        >
          <Text className="text-sm text-md-on-surface-variant">無每日預報資料</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="gap-2">
      <SectionLabel>{title}</SectionLabel>
      <View
        className="mx-4 rounded-[18px] border border-white/20 bg-white/12 px-3 py-1"
        style={getGlassStyle(16)}
      >
        {days.map((day, index) => {
          const left = toPercent(day.tempMin);
          const width = Math.max(2, toPercent(day.tempMax) - left);

          return (
            <React.Fragment key={day.key}>
              {index > 0 ? <View className="h-px bg-white/12" /> : null}
              <Pressable
                accessibilityRole={day.canDrillDown ? 'button' : 'text'}
                accessibilityLabel={
                  day.canDrillDown
                    ? `${day.name}，最高 ${Math.round(day.tempMax)} 度，${
                        day.isPast ? '查看歷史天氣' : '查看詳情'
                      }`
                    : `${day.name}，最高 ${Math.round(day.tempMax)} 度`
                }
                disabled={!day.canDrillDown}
                onPress={() => {
                  if (!day.canDrillDown) return;
                  // 昨日走歷史頁，其餘走單日詳情 —— 兩者的資料來源本來就不同
                  if (day.isPast) onSelectPastDay?.();
                  else onSelectDay?.(day.date);
                }}
                className={`flex-row items-center gap-2 ${
                  day.isToday ? '-mx-1.5 my-0.5 rounded-[12px] bg-white/[0.16] p-[7px]' : 'py-1.5'
                }`}
                style={(state) => [
                  day.isPast ? { opacity: 0.42 } : null,
                  // 按下時整列微微提亮，讓可點擊的那幾列有回饋
                  state.pressed && day.canDrillDown ? { opacity: 0.7 } : null,
                ]}
              >
                <Text
                  className={`w-[34px] text-[11px] text-md-on-surface ${
                    day.isToday ? 'font-medium' : ''
                  }`}
                >
                  {day.name}
                </Text>
                <WeatherIcon weatherCode={day.weatherCode} size={15} />
                {/* 缺值時留空但保留欄寬 —— 各列的溫度條起點必須對齊，
                    但不需要為此畫一個永遠是破折號的符號 */}
                <View className="w-[30px] flex-row items-center gap-0.5">
                  {day.precipitationProbability !== undefined ? (
                    <>
                      <AppIcon
                        name="water"
                        size={8}
                        color={day.isPast ? 'rgba(255,255,255,0.9)' : '#9ec5ff'}
                      />
                      <Text
                        className={`text-[9px] ${
                          day.isPast ? 'text-md-on-surface' : 'text-md-primary'
                        }`}
                      >
                        {Math.round(day.precipitationProbability)}%
                      </Text>
                    </>
                  ) : null}
                </View>
                <Text className="w-5 text-right text-[11px] text-md-on-surface-variant/72">
                  {Math.round(day.tempMin)}°
                </Text>
                <View className="h-1 flex-1 rounded bg-white/[0.18]">
                  <View
                    className="absolute h-1 rounded bg-white/90"
                    style={{ left: `${left}%`, width: `${width}%` }}
                  />
                  {day.currentTemp !== undefined ? (
                    <View
                      className="absolute -top-0.5 h-2 w-2 rounded-full border-2 border-md-background bg-white"
                      style={{ left: `${toPercent(day.currentTemp)}%` }}
                    />
                  ) : null}
                </View>
                <Text className="w-5 text-[11px] font-medium text-md-on-surface">
                  {Math.round(day.tempMax)}°
                </Text>
              </Pressable>
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
});
