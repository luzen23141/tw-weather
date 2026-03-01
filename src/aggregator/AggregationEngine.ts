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
   * 以 timestamp 對齊，各時間點分別聚合
   */
  private aggregateHourlyForecasts(
    results: WeatherData[],
    config: AggregationConfig,
  ): HourlyForecast[] {
    if (results.length === 0) return [];

    // 使用第一個結果的 timestamp 序列作為基準
    const baseHourly = results[0]?.hourlyForecast ?? [];
    const allHourly = results.map((r) => r.hourlyForecast);

    return baseHourly.map((baseHour, idx) => {
      // 收集各來源在此時間點的資料
      const hoursAtIdx = allHourly.map((h) => h[idx]).filter((h): h is HourlyForecast => !!h);

      if (hoursAtIdx.length === 0) return baseHour;

      // 各欄位聚合
      const temps = hoursAtIdx.map((h) => h.temperature);
      const temperature = aggregateTemperature(temps, config.temperature);

      const appTemps = hoursAtIdx.map((h) => h.apparentTemperature);
      const apparentTemperature = aggregateNumericValues(appTemps, 'average');

      const codes = hoursAtIdx.map((h) => h.weatherCode);
      const weatherCode = mode(codes);

      const humidities = hoursAtIdx.map((h) => h.humidity);
      const humidity = aggregateNumericValues(humidities, 'average');

      const precipProbs = hoursAtIdx.map((h) => h.precipitationProbability);
      const precipitationProbability = Math.round(
        aggregatePrecipitationProbability(precipProbs, config.precipitation),
      );

      const precips = hoursAtIdx.map((h) => h.precipitation);
      const precipitation = Math.max(...precips);

      const windSpeeds = hoursAtIdx.map((h) => h.windSpeed);
      const windSpeed = aggregateNumericValues(windSpeeds, 'average');

      const windDirection = baseHour.windDirection;

      const description = baseHour.description;

      return {
        timestamp: baseHour.timestamp,
        temperature,
        apparentTemperature,
        weatherCode,
        description,
        precipitationProbability,
        precipitation,
        humidity,
        windSpeed,
        windDirection,
      };
    });
  }

  /**
   * 聚合每日預報
   * 以 date 對齊，各日期分別聚合
   */
  private aggregateDailyForecasts(
    results: WeatherData[],
    config: AggregationConfig,
  ): DailyForecast[] {
    if (results.length === 0) return [];

    // 使用第一個結果的 date 序列作為基準
    const baseDaily = results[0]?.dailyForecast ?? [];
    const allDaily = results.map((r) => r.dailyForecast);

    return baseDaily.map((baseDay, idx) => {
      // 收集各來源在此日期的資料
      const daysAtIdx = allDaily.map((d) => d[idx]).filter((d): d is DailyForecast => !!d);

      if (daysAtIdx.length === 0) return baseDay;

      // 溫度範圍聚合
      const mins = daysAtIdx.map((d) => d.temperatureMin);
      const maxes = daysAtIdx.map((d) => d.temperatureMax);
      const tempRange = aggregateTemperatureRange(mins, maxes, config.temperature);

      const codes = daysAtIdx.map((d) => d.weatherCode);
      const weatherCode = mode(codes);

      const precipProbs = daysAtIdx.map((d) => d.precipitationProbability);
      const precipitationProbability = Math.round(
        aggregatePrecipitationProbability(precipProbs, config.precipitation),
      );

      const precipSums = daysAtIdx.map((d) => d.precipitationSum);
      const precipitationSum = Math.max(...precipSums);

      const windSpeeds = daysAtIdx.map((d) => d.windSpeedMax);
      const windSpeedMax = Math.max(...windSpeeds);

      const uvIndices = daysAtIdx
        .map((d) => d.uvIndexMax)
        .filter((u): u is number => u !== undefined);
      const uvIndexMax = uvIndices.length > 0 ? Math.max(...uvIndices) : undefined;

      // sunrise/sunset: 取第一個值
      const sunrise = baseDay.sunrise;
      const sunset = baseDay.sunset;

      const description = baseDay.description;

      const result: DailyForecast = {
        date: baseDay.date,
        temperatureMax: tempRange.max,
        temperatureMin: tempRange.min,
        weatherCode,
        description,
        precipitationProbability,
        precipitationSum,
        sunrise,
        sunset,
        windSpeedMax,
      };

      if (uvIndexMax !== undefined) {
        result.uvIndexMax = uvIndexMax;
      }

      return result;
    });
  }
}

export { AggregationEngine };
