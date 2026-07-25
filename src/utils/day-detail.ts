/**
 * 單日詳情的正規化層。
 *
 * 「昨天的詳情」與「後天的詳情」是同一個畫面、不同時間方向 —— 日期、天氣、
 * 高低溫、各項指標，要看的欄位完全一樣。但資料型別不同：過去是
 * `HistoricalDayWeather`（實際觀測），未來是 `DailyForecast`（預報）。
 *
 * 這裡把兩者收斂成同一個形狀，讓歷史頁與 /day/[date] 共用同一個呈現元件，
 * 而不是為過去和未來各寫一套幾乎一樣的 UI。
 *
 * 差異保留在 `metrics`：觀測有平均值與日較差，預報有降雨機率與 UV 上限。
 * 硬把兩邊湊成同一組欄位只會逼出假資料。
 */

import { DailyForecast, HistoricalDayWeather } from '@/api/types';

export interface DayMetric {
  key: string;
  label: string;
  value: string;
}

export interface DayDetailData {
  date: string;
  weatherCode: number;
  description: string;
  tempMax: number;
  tempMin: number;
  metrics: DayMetric[];
  /** true = 實際觀測，false = 預報。決定文案語氣與是否標示「觀測」。 */
  isObservation: boolean;
}

export function dayDetailFromHistory(day: HistoricalDayWeather): DayDetailData {
  return {
    date: day.date,
    weatherCode: day.weatherCode,
    description: day.description,
    tempMax: day.temperatureMax,
    tempMin: day.temperatureMin,
    isObservation: true,
    metrics: [
      { key: 'avg', label: '平均溫', value: `${Math.round(day.temperatureAvg)}°` },
      {
        key: 'range',
        label: '日較差',
        value: `${Math.round(day.temperatureMax - day.temperatureMin)}°`,
      },
      { key: 'humidity', label: '平均濕度', value: `${Math.round(day.humidityAvg)}%` },
      { key: 'wind', label: '平均風速', value: `${Math.round(day.windSpeedAvg)} km/h` },
      { key: 'precip', label: '總降水量', value: `${day.precipitationSum.toFixed(1)} mm` },
    ],
  };
}

export function dayDetailFromForecast(day: DailyForecast): DayDetailData {
  const metrics: DayMetric[] = [
    {
      key: 'range',
      label: '日較差',
      value: `${Math.round(day.temperatureMax - day.temperatureMin)}°`,
    },
    { key: 'pop', label: '降雨機率', value: `${Math.round(day.precipitationProbability)}%` },
    { key: 'precip', label: '總降水量', value: `${day.precipitationSum.toFixed(1)} mm` },
    { key: 'wind', label: '最大風速', value: `${Math.round(day.windSpeedMax)} km/h` },
  ];

  if (day.uvIndexMax !== undefined) {
    metrics.push({ key: 'uv', label: 'UV 最高', value: `${Math.round(day.uvIndexMax)}` });
  }

  return {
    date: day.date,
    weatherCode: day.weatherCode,
    description: day.description,
    tempMax: day.temperatureMax,
    tempMin: day.temperatureMin,
    isObservation: false,
    metrics,
  };
}
