/**
 * 聚合引擎
 * 根據 AggregationConfig 合併多個天氣資料來源的結果
 */

import {
  AggregationConfig,
  CurrentWeather,
  DailyForecast,
  HourlyForecast,
  WeatherData,
} from '../api/types';

import {
  aggregateNumericValues,
  aggregatePrecipitationProbability,
  aggregateTemperature,
  aggregateTemperatureRange,
  mode,
} from './aggregation.utils';

class AggregationEngine {
  /**
   * 聚合多個天氣資料來源
   */
  aggregate(results: WeatherData[], config: AggregationConfig): WeatherData {
    if (results.length === 0) {
      throw new Error('No weather data to aggregate');
    }

    const baseResult = results[0];
    if (!baseResult) {
      throw new Error('Invalid weather data');
    }

    // 聚合各部分
    const current = this.aggregateCurrentWeather(results, config);
    const hourlyForecast = this.aggregateHourlyForecasts(results, config);
    const dailyForecast = this.aggregateDailyForecasts(results, config);

    // 取第一個結果的歷史資料（均相同）
    const history = baseResult.history ?? [];

    return {
      location: baseResult.location,
      source: 'aggregate',
      fetchedAt: new Date().toISOString(),
      current,
      hourlyForecast,
      dailyForecast,
      history,
    };
  }

  /**
   * 聚合當前天氣
   */
  private aggregateCurrentWeather(
    results: WeatherData[],
    config: AggregationConfig,
  ): CurrentWeather {
    const currents = results.map((r) => r.current);

    // 聚合各欄位
    const temperatures = currents.map((c) => c.temperature);
    const temperature = aggregateTemperature(temperatures, config.temperature);

    const apparentTemperatures = currents.map((c) => c.apparentTemperature);
    const apparentTemperature = aggregateNumericValues(apparentTemperatures, 'average');

    const humidities = currents.map((c) => c.humidity);
    const humidity = aggregateNumericValues(humidities, 'average');

    // 天氣代碼：取眾數（最常出現的）
    const weatherCodes = currents.map((c) => c.weatherCode);
    const weatherCode = mode(weatherCodes);

    // 風速：平均
    const windSpeeds = currents.map((c) => c.windSpeed);
    const windSpeed = aggregateNumericValues(windSpeeds, 'average');

    // 風向：取第一個有效值
    const windDirection = currents[0]?.windDirection ?? 0;

    // 降水量：取最大值（任一預報有雨）
    const precipitations = currents.map((c) => c.precipitation);
    const precipitation = Math.max(...precipitations);

    // 降雨機率：根據閾值規則
    const precipProbs = currents.map((c) => c.precipitationProbability ?? 0);
    const precipitationProbability = Math.round(
      aggregatePrecipitationProbability(precipProbs, config.precipitation),
    );

    // 可選欄位
    const pressures = currents.map((c) => c.pressure).filter((p): p is number => p !== undefined);
    const pressure =
      pressures.length > 0 ? aggregateNumericValues(pressures, 'average') : undefined;

    const visibilities = currents
      .map((c) => c.visibility)
      .filter((v): v is number => v !== undefined);
    const visibility =
      visibilities.length > 0 ? aggregateNumericValues(visibilities, 'average') : undefined;

    // 描述：取第一個
    const description = currents[0]?.description ?? '未知';

    const uvIndex = currents.find((c) => c.uvIndex)?.uvIndex;

    const result: CurrentWeather = {
      timestamp: new Date().toISOString(),
      temperature,
      apparentTemperature,
      humidity,
      description,
      weatherCode,
      windSpeed,
      windDirection,
      precipitation,
      precipitationProbability,
    };

    if (pressure !== undefined) {
      result.pressure = pressure;
    }
    if (visibility !== undefined) {
      result.visibility = visibility;
    }
    if (uvIndex !== undefined) {
      result.uvIndex = uvIndex;
    }

    return result;
  }

  /**
   * 聚合逐時預報
   * 以 timestamp（截斷至小時）為 key 對齊各來源，避免索引錯位
   */
  private aggregateHourlyForecasts(
    results: WeatherData[],
    config: AggregationConfig,
  ): HourlyForecast[] {
    if (results.length === 0) return [];

    // 建立 timestamp → [HourlyForecast] 的 map，截斷至小時精度對齊
    const hourMap = new Map<string, HourlyForecast[]>();

    for (const result of results) {
      for (const hour of result.hourlyForecast) {
        // 截斷至小時（去除分鐘/秒），作為對齊 key
        const hourKey = hour.timestamp.slice(0, 13); // "YYYY-MM-DDTHH"
        const existing = hourMap.get(hourKey);
        if (existing) {
          existing.push(hour);
        } else {
          hourMap.set(hourKey, [hour]);
        }
      }
    }

    // 依時間排序後聚合
    const sortedKeys = [...hourMap.keys()].sort();

    return sortedKeys
      .map((key) => {
        const hoursAtKey = hourMap.get(key) ?? [];
        const base = hoursAtKey[0];
        if (!base) return null;

        if (hoursAtKey.length === 1) return base;

        const temps = hoursAtKey.map((h) => h.temperature);
        const temperature = aggregateTemperature(temps, config.temperature);

        const appTemps = hoursAtKey.map((h) => h.apparentTemperature);
        const apparentTemperature = aggregateNumericValues(appTemps, 'average');

        const codes = hoursAtKey.map((h) => h.weatherCode);
        const weatherCode = mode(codes);

        const humidities = hoursAtKey.map((h) => h.humidity);
        const humidity = aggregateNumericValues(humidities, 'average');

        const precipProbs = hoursAtKey.map((h) => h.precipitationProbability);
        const precipitationProbability = Math.round(
          aggregatePrecipitationProbability(precipProbs, config.precipitation),
        );

        const precips = hoursAtKey.map((h) => h.precipitation);
        const precipitation = Math.max(...precips);

        const windSpeeds = hoursAtKey.map((h) => h.windSpeed);
        const windSpeed = aggregateNumericValues(windSpeeds, 'average');

        return {
          timestamp: base.timestamp,
          temperature,
          apparentTemperature,
          weatherCode,
          description: base.description,
          precipitationProbability,
          precipitation,
          humidity,
          windSpeed,
          windDirection: base.windDirection,
        };
      })
      .filter((h): h is HourlyForecast => h !== null);
  }

  /**
   * 聚合每日預報
   * 以 date（YYYY-MM-DD）為 key 對齊各來源，避免索引錯位
   */
  private aggregateDailyForecasts(
    results: WeatherData[],
    config: AggregationConfig,
  ): DailyForecast[] {
    if (results.length === 0) return [];

    // 建立 date → [DailyForecast] 的 map
    const dayMap = new Map<string, DailyForecast[]>();

    for (const result of results) {
      for (const day of result.dailyForecast) {
        const existing = dayMap.get(day.date);
        if (existing) {
          existing.push(day);
        } else {
          dayMap.set(day.date, [day]);
        }
      }
    }

    // 依日期排序後聚合
    const sortedDates = [...dayMap.keys()].sort();

    return sortedDates
      .map((date) => {
        const daysAtDate = dayMap.get(date) ?? [];
        const base = daysAtDate[0];
        if (!base) return null;

        if (daysAtDate.length === 1) return base;

        const mins = daysAtDate.map((d) => d.temperatureMin);
        const maxes = daysAtDate.map((d) => d.temperatureMax);
        const tempRange = aggregateTemperatureRange(mins, maxes, config.temperature);

        const codes = daysAtDate.map((d) => d.weatherCode);
        const weatherCode = mode(codes);

        const precipProbs = daysAtDate.map((d) => d.precipitationProbability);
        const precipitationProbability = Math.round(
          aggregatePrecipitationProbability(precipProbs, config.precipitation),
        );

        const precipSums = daysAtDate.map((d) => d.precipitationSum);
        const precipitationSum = Math.max(...precipSums);

        const windSpeeds = daysAtDate.map((d) => d.windSpeedMax);
        const windSpeedMax = Math.max(...windSpeeds);

        const uvIndices = daysAtDate
          .map((d) => d.uvIndexMax)
          .filter((u): u is number => u !== undefined);
        const uvIndexMax = uvIndices.length > 0 ? Math.max(...uvIndices) : undefined;

        const result: DailyForecast = {
          date,
          temperatureMax: tempRange.max,
          temperatureMin: tempRange.min,
          weatherCode,
          description: base.description,
          precipitationProbability,
          precipitationSum,
          windSpeedMax,
          ...(base.sunrise !== undefined && { sunrise: base.sunrise }),
          ...(base.sunset !== undefined && { sunset: base.sunset }),
        };

        if (uvIndexMax !== undefined) {
          result.uvIndexMax = uvIndexMax;
        }

        return result;
      })
      .filter((d): d is DailyForecast => d !== null);
  }
}

export { AggregationEngine };
