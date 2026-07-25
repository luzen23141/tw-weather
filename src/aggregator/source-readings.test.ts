import { AggregationEngine } from '@/aggregator/AggregationEngine';
import {
  DEFAULT_AGGREGATION_CONFIG,
  type CurrentWeather,
  type SourceReading,
  type WeatherData,
} from '@/api/types';

function makeCurrent(temperature: number, weatherCode: number): CurrentWeather {
  return {
    timestamp: '2026-07-23T12:00:00.000Z',
    temperature,
    apparentTemperature: temperature + 3,
    humidity: 70,
    description: 'desc',
    weatherCode,
    windSpeed: 10,
    windDirection: 90,
    precipitation: 0,
  };
}

function makeWeatherData(
  source: WeatherData['source'],
  temperature: number,
  code: number,
): WeatherData {
  return {
    location: { latitude: 25, longitude: 121, name: '測試' },
    source,
    fetchedAt: '2026-07-23T12:00:00.000Z',
    current: makeCurrent(temperature, code),
    hourlyForecast: [],
    dailyForecast: [],
    history: [],
  };
}

const aggregationEngine = new AggregationEngine();

describe('聚合保留各來源原始讀數', () => {
  it('聚合結果帶出每個來源的原始溫度與天氣代碼', () => {
    const result = aggregationEngine.aggregate(
      [makeWeatherData('cwa', 27, 3), makeWeatherData('open-meteo', 30, 61)],
      DEFAULT_AGGREGATION_CONFIG,
    );

    expect(result.sourceReadings).toEqual([
      { source: 'cwa', temperature: 27, weatherCode: 3 },
      { source: 'open-meteo', temperature: 30, weatherCode: 61 },
    ]);
  });

  // 原始值必須是聚合「之前」的數字。先前 union 模式算出 min/max 後只回傳中點，
  // 各來源的分歧在資料層就被丟棄，UI 只能拿 mock 撐場面。
  it('原始讀數不受聚合規則影響', () => {
    const result = aggregationEngine.aggregate(
      [makeWeatherData('cwa', 20, 0), makeWeatherData('open-meteo', 30, 0)],
      { ...DEFAULT_AGGREGATION_CONFIG, temperature: 'average' },
    );

    const temps = result.sourceReadings?.map((r: SourceReading) => r.temperature);
    expect(temps).toEqual([20, 30]);
    // 聚合值本身是平均，但原始值仍各自保留
    expect(result.current.temperature).toBe(25);
  });

  it('排除已經是聚合結果的項目，避免自我引用', () => {
    const result = aggregationEngine.aggregate(
      [makeWeatherData('cwa', 27, 3), makeWeatherData('aggregate', 28, 3)],
      DEFAULT_AGGREGATION_CONFIG,
    );

    expect(result.sourceReadings?.map((r: SourceReading) => r.source)).toEqual(['cwa']);
  });
});
