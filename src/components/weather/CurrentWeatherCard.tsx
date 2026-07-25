import React from 'react';
import { Text, View } from 'react-native';

import { CurrentWeather, HourlyForecast, Location } from '../../api/types';
import { getGlassStyle } from '../ui/glass';
import { getWeatherCodeInfo } from '../../utils/weather-code';
import { WeatherIcon } from '../icons/WeatherIcon';

import { MetricRow } from './MetricRow';

import { compareWithYesterday } from '@/utils/day-comparison';

import { formatLocationSecondaryName } from '@/utils/location-display';

export interface CurrentWeatherCardProps {
  data: CurrentWeather;
  location: Location;
  /** 今日最高／最低氣溫，取自每日預報。缺值時該行不顯示。 */
  todayHigh?: number;
  todayLow?: number;
  /**
   * 昨日實際最高溫，用來給出「比昨天熱/涼」的結論。
   *
   * 早上出門前真正要判斷的是溫度的**變化方向**，不是絕對值 —— 「今天 31 度」
   * 要搭配「昨天幾度」才有決策價值。來自 history，可能缺席。
   */
  yesterdayHigh?: number;
  /** 今日最高體感，由今日逐時的 apparentTemperature 取最大值。 */
  apparentHigh?: number;
  /**
   * 當前時段的逐時預報，用來補 `current` 端點缺的欄位。
   *
   * Open-Meteo 的 current 不支援 `precipitation_probability` —— 那是 hourly
   * 才有的欄位。與其顯示破折號，不如拿同一時刻的 hourly 值，這是真實資料而非
   * 推估。UV 則連 hourly 都沒有請求，維持留白。
   */
  currentHour?: HourlyForecast | undefined;
  /**
   * 今日預報的 UV 最高值。
   *
   * 沒有來源提供「當前」UV，這是唯一拿得到的 UV 資訊；顯示時會標明是日最高，
   * 不讓它冒充即時值。
   */
  todayUvIndexMax?: number | undefined;
  actionSlot?: React.ReactNode;
}

/**
 * 當前天氣卡。
 *
 * 設計要點（詳見 design-system/mockups/home.html）：
 * - **單層玻璃。** 先前是卡片 → 溫度區塊 → StatCard 三層玻璃疊玻璃，每層各帶
 *   邊框，在漸層背景上互相干擾。現在只有卡片一層，內部靠留白與一條分隔線分區。
 * - **圖示脫框並置。** 溫度從 74px 降到 52px，天氣圖示從方框裡拉出來與溫度並排。
 *   74px 在 375px 寬的畫面上單一數字就佔掉近五分之一寬度，圖示被壓成配角。
 * - **地點退回脈絡層級。** 22px bold → 17px medium。地點是「這是哪裡」，不是主角。
 * - **無裝飾性模糊圓。** 半透明玻璃上疊光斑會讓同一段文字在不同位置有不同對比度。
 * - **資料來源不在這裡。** 已獨立為 SourceRow，置於卡片外、逐時預報上方。
 */
export const CurrentWeatherCard = React.memo(function CurrentWeatherCard({
  data,
  location,
  todayHigh,
  todayLow,
  yesterdayHigh,
  apparentHigh,
  currentHour,
  todayUvIndexMax,
  actionSlot,
}: CurrentWeatherCardProps): React.ReactElement {
  const weatherInfo = getWeatherCodeInfo(data.weatherCode);
  const secondaryLocationText = formatLocationSecondaryName(location);

  const hasRange = todayHigh !== undefined && todayLow !== undefined;
  const rangeText = hasRange ? `${Math.round(todayHigh)}° / ${Math.round(todayLow)}°` : null;

  const comparison = compareWithYesterday(todayHigh, yesterdayHigh);

  const apparentText =
    apparentHigh !== undefined
      ? `體感 ${Math.round(data.apparentTemperature)}° · 最高 ${Math.round(apparentHigh)}°`
      : `體感 ${Math.round(data.apparentTemperature)}°`;

  return (
    <View
      className="mx-4 overflow-hidden rounded-[22px] border border-white/[0.22] bg-white/[0.14] px-3.5 py-4"
      style={getGlassStyle(20)}
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <Text className="text-[17px] font-medium text-md-on-surface">{location.name}</Text>
          {secondaryLocationText ? (
            <Text className="mt-0.5 text-[10px] text-md-on-surface-variant/70">
              {secondaryLocationText}
            </Text>
          ) : null}
        </View>
        {actionSlot}
      </View>

      <View className="mt-4 flex-row items-center gap-3">
        <WeatherIcon weatherCode={data.weatherCode} size={52} />
        <View>
          <Text
            className="font-medium text-md-on-surface"
            style={{ fontSize: 52, lineHeight: 48, letterSpacing: -2 }}
          >
            {Math.round(data.temperature)}°
          </Text>
          <Text className="mt-2 text-[13px] text-md-on-surface">{weatherInfo.description}</Text>
          {rangeText !== null || comparison !== null ? (
            <Text className="mt-1 text-[10px] text-md-on-surface-variant/72">
              {rangeText}
              {rangeText !== null && comparison !== null ? '  ·  ' : null}
              {comparison !== null ? (
                // 比較結論是這一行的重點，數字只是佐證 —— 給它更高的對比度。
                // 溫差顯著時再往上加一階，讓「今天差很多」在掃視時就攔得住人。
                <Text
                  className={
                    comparison.significant
                      ? 'font-medium text-md-warning'
                      : 'font-medium text-md-on-surface'
                  }
                >
                  {comparison.text}
                </Text>
              ) : null}
            </Text>
          ) : null}
          <Text className="mt-0.5 text-[10px] text-md-on-surface-variant/72">{apparentText}</Text>
        </View>
      </View>

      <MetricRow
        humidity={data.humidity}
        windSpeed={data.windSpeed}
        precipitationProbability={
          data.precipitationProbability ?? currentHour?.precipitationProbability
        }
        precipitation={data.precipitation}
        /*
          當前 UV 沒有任何來源提供，退回今日預報的 uvIndexMax。
          先前這格傳 data.uvIndex，而它恆為 undefined —— 等於這格永遠不渲染，
          UV 這項資訊在 app 裡從來沒出現過。
        */
        uvIndex={data.uvIndex ?? todayUvIndexMax}
        uvIsDailyMax={data.uvIndex === undefined && todayUvIndexMax !== undefined}
      />
    </View>
  );
});
