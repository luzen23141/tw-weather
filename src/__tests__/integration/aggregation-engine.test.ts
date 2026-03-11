import { AggregationEngine } from '@/aggregator/AggregationEngine';
import { DEFAULT_AGGREGATION_CONFIG, type WeatherData, type WeatherSource } from '@/api/types';

const FIXED_NOW = '2026-03-09T08:00:00.000Z';

function createWeatherData(
  source: WeatherSource,
  values: {
    currentTemp: number;
    apparentTemp: number;
    humidity: number;
    weatherCode: number;
    windSpeed: number;
    windDirection: number;
    precipitation: number;
    precipitationProbability: number;
    description: string;
    pressure?: number;
    visibility?: number;
    uvIndex?: number;
    hourlyTemps: [number, number];
    hourlyAppTemps: [number, number];
    hourlyCodes: [number, number];
    hourlyPrecipitationProbability: [number, number];
    hourlyPrecipitation: [number, number];
    hourlyHumidity: [number, number];
    hourlyWindSpeed: [number, number];
    dailyMin: number;
    dailyMax: number;
    dailyCode: number;
    dailyPrecipitationProbability: number;
    dailyPrecipitationSum: number;
    dailyWindSpeedMax: number;
    dailyUvIndexMax?: number;
  },
): WeatherData {
  const current = {
    timestamp: '2026-03-09T07:00:00.000Z',
    temperature: values.currentTemp,
    apparentTemperature: values.apparentTemp,
    humidity: values.humidity,
    description: values.description,
    weatherCode: values.weatherCode,
    windSpeed: values.windSpeed,
    windDirection: values.windDirection,
    precipitation: values.precipitation,
    precipitationProbability: values.precipitationProbability,
    ...(values.pressure !== undefined ? { pressure: values.pressure } : {}),
    ...(values.visibility !== undefined ? { visibility: values.visibility } : {}),
    ...(values.uvIndex !== undefined ? { uvIndex: values.uvIndex } : {}),
  };

  const dailyForecast = {
    date: '2026-03-10',
    temperatureMin: values.dailyMin,
    temperatureMax: values.dailyMax,
    weatherCode: values.dailyCode,
    description: `${values.description}-day`,
    precipitationProbability: values.dailyPrecipitationProbability,
    precipitationSum: values.dailyPrecipitationSum,
    sunrise: '2026-03-10T06:10:00.000Z',
    sunset: '2026-03-10T18:05:00.000Z',
    windSpeedMax: values.dailyWindSpeedMax,
    ...(values.dailyUvIndexMax !== undefined ? { uvIndexMax: values.dailyUvIndexMax } : {}),
  };

  return {
    location: {
      latitude: 25.033,
      longitude: 121.5654,
      name: '台北市信義區',
      city: '台北市',
      township: '信義區',
    },
    source,
    fetchedAt: '2026-03-09T07:30:00.000Z',
    current,
    hourlyForecast: [
      {
        timestamp: '2026-03-09T09:00:00.000Z',
        temperature: values.hourlyTemps[0],
        apparentTemperature: values.hourlyAppTemps[0],
        weatherCode: values.hourlyCodes[0],
        description: `${values.description}-09`,
        precipitationProbability: values.hourlyPrecipitationProbability[0],
        precipitation: values.hourlyPrecipitation[0],
        humidity: values.hourlyHumidity[0],
        windSpeed: values.hourlyWindSpeed[0],
        windDirection: values.windDirection,
      },
      {
        timestamp: '2026-03-09T10:00:00.000Z',
        temperature: values.hourlyTemps[1],
        apparentTemperature: values.hourlyAppTemps[1],
        weatherCode: values.hourlyCodes[1],
        description: `${values.description}-10`,
        precipitationProbability: values.hourlyPrecipitationProbability[1],
        precipitation: values.hourlyPrecipitation[1],
        humidity: values.hourlyHumidity[1],
        windSpeed: values.hourlyWindSpeed[1],
        windDirection: values.windDirection,
      },
    ],
    dailyForecast: [dailyForecast],
    history: [
      {
        date: '2026-03-08',
        temperatureMax: 28,
        temperatureMin: 19,
        temperatureAvg: 23,
        weatherCode: 1,
        description: '昨日晴朗',
        precipitationSum: 0,
        windSpeedAvg: 10,
        humidityAvg: 60,
        source,
      },
    ],
  };
}

describe('AggregationEngine', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(FIXED_NOW));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('在沒有資料來源時應拋出錯誤', () => {
    const engine = new AggregationEngine();

    expect(() => engine.aggregate([], DEFAULT_AGGREGATION_CONFIG)).toThrow(
      'No weather data to aggregate',
    );
  });

  it('應以真實來源資料聚合 current、hourly、daily 與 history', () => {
    const engine = new AggregationEngine();
    const results = [
      createWeatherData('cwa', {
        currentTemp: 24,
        apparentTemp: 25,
        humidity: 60,
        weatherCode: 1,
        windSpeed: 12,
        windDirection: 45,
        precipitation: 0.4,
        precipitationProbability: 40,
        description: '晴時多雲',
        pressure: 1008,
        visibility: 10,
        hourlyTemps: [24, 25],
        hourlyAppTemps: [25, 26],
        hourlyCodes: [1, 2],
        hourlyPrecipitationProbability: [30, 45],
        hourlyPrecipitation: [0.2, 0.5],
        hourlyHumidity: [60, 62],
        hourlyWindSpeed: [10, 12],
        dailyMin: 20,
        dailyMax: 28,
        dailyCode: 2,
        dailyPrecipitationProbability: 30,
        dailyPrecipitationSum: 1.2,
        dailyWindSpeedMax: 18,
      }),
      createWeatherData('open-meteo', {
        currentTemp: 26,
        apparentTemp: 27,
        humidity: 66,
        weatherCode: 1,
        windSpeed: 18,
        windDirection: 90,
        precipitation: 2.8,
        precipitationProbability: 60,
        description: '局部短暫雨',
        pressure: 1012,
        visibility: 8,
        uvIndex: 7,
        hourlyTemps: [26, 27],
        hourlyAppTemps: [27, 28],
        hourlyCodes: [1, 3],
        hourlyPrecipitationProbability: [60, 55],
        hourlyPrecipitation: [1.1, 1.3],
        hourlyHumidity: [66, 68],
        hourlyWindSpeed: [18, 20],
        dailyMin: 21,
        dailyMax: 30,
        dailyCode: 1,
        dailyPrecipitationProbability: 70,
        dailyPrecipitationSum: 5.4,
        dailyWindSpeedMax: 22,
        dailyUvIndexMax: 8,
      }),
      createWeatherData('weatherapi', {
        currentTemp: 30,
        apparentTemp: 31,
        humidity: 72,
        weatherCode: 3,
        windSpeed: 24,
        windDirection: 135,
        precipitation: 5.1,
        precipitationProbability: 80,
        description: '午後雷陣雨',
        visibility: 6,
        hourlyTemps: [30, 29],
        hourlyAppTemps: [31, 30],
        hourlyCodes: [3, 3],
        hourlyPrecipitationProbability: [80, 75],
        hourlyPrecipitation: [2.5, 2.1],
        hourlyHumidity: [72, 70],
        hourlyWindSpeed: [24, 22],
        dailyMin: 23,
        dailyMax: 32,
        dailyCode: 3,
        dailyPrecipitationProbability: 80,
        dailyPrecipitationSum: 8.6,
        dailyWindSpeedMax: 26,
        dailyUvIndexMax: 10,
      }),
    ];

    const aggregated = engine.aggregate(results, DEFAULT_AGGREGATION_CONFIG);

    expect(aggregated.location).toEqual(results[0]?.location);
    expect(aggregated.source).toBe('aggregate');
    expect(aggregated.fetchedAt).toBe(FIXED_NOW);
    expect(aggregated.history).toEqual(results[0]?.history);

    expect(aggregated.current).toMatchObject({
      timestamp: FIXED_NOW,
      temperature: 27,
      apparentTemperature: 27.666666666666668,
      humidity: 66,
      description: '晴時多雲',
      weatherCode: 1,
      windSpeed: 18,
      windDirection: 45,
      precipitation: 5.1,
      precipitationProbability: 80,
      pressure: 1010,
      visibility: 8,
      uvIndex: 7,
    });

    expect(aggregated.hourlyForecast).toHaveLength(2);
    expect(aggregated.hourlyForecast[0]).toEqual({
      timestamp: '2026-03-09T09:00:00.000Z',
      temperature: 27,
      apparentTemperature: 27.666666666666668,
      weatherCode: 1,
      description: '晴時多雲-09',
      precipitationProbability: 80,
      precipitation: 2.5,
      humidity: 66,
      windSpeed: 17.333333333333332,
      windDirection: 45,
    });
    expect(aggregated.hourlyForecast[1]).toEqual({
      timestamp: '2026-03-09T10:00:00.000Z',
      temperature: 27,
      apparentTemperature: 28,
      weatherCode: 3,
      description: '晴時多雲-10',
      precipitationProbability: 75,
      precipitation: 2.1,
      humidity: 66.66666666666667,
      windSpeed: 18,
      windDirection: 45,
    });

    expect(aggregated.dailyForecast).toEqual([
      {
        date: '2026-03-10',
        temperatureMax: 32,
        temperatureMin: 20,
        weatherCode: 2,
        description: '晴時多雲-day',
        precipitationProbability: 80,
        precipitationSum: 8.6,
        sunrise: '2026-03-10T06:10:00.000Z',
        sunset: '2026-03-10T18:05:00.000Z',
        windSpeedMax: 26,
        uvIndexMax: 10,
      },
    ]);
  });

  it('應支援 average 與 all 規則，且在缺少可選欄位時不輸出該欄位', () => {
    const engine = new AggregationEngine();
    const results = [
      createWeatherData('cwa', {
        currentTemp: 20,
        apparentTemp: 21,
        humidity: 55,
        weatherCode: 2,
        windSpeed: 10,
        windDirection: 180,
        precipitation: 0,
        precipitationProbability: 70,
        description: '陰天',
        hourlyTemps: [20, 22],
        hourlyAppTemps: [21, 23],
        hourlyCodes: [2, 2],
        hourlyPrecipitationProbability: [70, 30],
        hourlyPrecipitation: [0, 0.2],
        hourlyHumidity: [55, 57],
        hourlyWindSpeed: [10, 12],
        dailyMin: 18,
        dailyMax: 24,
        dailyCode: 2,
        dailyPrecipitationProbability: 70,
        dailyPrecipitationSum: 0.2,
        dailyWindSpeedMax: 14,
      }),
      createWeatherData('open-meteo', {
        currentTemp: 26,
        apparentTemp: 27,
        humidity: 65,
        weatherCode: 4,
        windSpeed: 14,
        windDirection: 200,
        precipitation: 1.2,
        precipitationProbability: 40,
        description: '多雲',
        hourlyTemps: [26, 24],
        hourlyAppTemps: [27, 25],
        hourlyCodes: [4, 4],
        hourlyPrecipitationProbability: [40, 20],
        hourlyPrecipitation: [1.2, 0.6],
        hourlyHumidity: [65, 63],
        hourlyWindSpeed: [14, 16],
        dailyMin: 20,
        dailyMax: 28,
        dailyCode: 4,
        dailyPrecipitationProbability: 40,
        dailyPrecipitationSum: 1.8,
        dailyWindSpeedMax: 16,
      }),
    ];

    const aggregated = engine.aggregate(results, {
      ...DEFAULT_AGGREGATION_CONFIG,
      temperature: 'average',
      precipitation: 'all',
    });

    expect(aggregated.current.temperature).toBe(23);
    expect(aggregated.current.apparentTemperature).toBe(24);
    expect(aggregated.current.precipitationProbability).toBe(55);
    expect(aggregated.current.pressure).toBeUndefined();
    expect(aggregated.current.visibility).toBeUndefined();
    expect(aggregated.current.uvIndex).toBeUndefined();

    expect(aggregated.hourlyForecast[0]?.temperature).toBe(23);
    expect(aggregated.hourlyForecast[0]?.precipitationProbability).toBe(55);
    expect(aggregated.dailyForecast[0]).toEqual({
      date: '2026-03-10',
      temperatureMax: 26,
      temperatureMin: 19,
      weatherCode: 2,
      description: '陰天-day',
      precipitationProbability: 55,
      precipitationSum: 1.8,
      sunrise: '2026-03-10T06:10:00.000Z',
      sunset: '2026-03-10T18:05:00.000Z',
      windSpeedMax: 16,
    });
  });
});
