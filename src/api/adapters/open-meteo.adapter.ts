import {
  CurrentWeather,
  DailyForecast,
  HistoricalDayWeather,
  HourlyForecast,
  Location,
  WeatherApiAdapter,
  WeatherApiError,
  WeatherData,
  WeatherSource,
} from '../types';
import { getWeatherDescription } from '../weather-code.map';

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const ARCHIVE_URL = 'https://archive-api.open-meteo.com/v1/archive';

interface OpenMeteoCurrentWeather {
  temperature: number;
  relative_humidity: number;
  apparent_temperature: number;
  is_day: number;
  weathercode: number;
  wind_speed_10m: number;
  wind_direction_10m: number;
  precipitation: number;
  pressure_msl?: number;
  visibility?: number;
}

interface OpenMeteoForecastResponse {
  current: OpenMeteoCurrentWeather;
  hourly: {
    time: string[];
    temperature_2m: number[];
    apparent_temperature: number[];
    weather_code: number[];
    precipitation: number[];
    precipitation_probability: number[];
    relative_humidity_2m: number[];
    wind_speed_10m: number[];
    wind_direction_10m: number[];
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
    precipitation_probability_max: number[];
    sunrise: string[];
    sunset: string[];
    wind_speed_10m_max: number[];
    uv_index_max?: number[];
  };
}

interface OpenMeteoArchiveResponse {
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    temperature_2m_mean: number[];
    precipitation_sum: number[];
    wind_speed_10m_max: number[];
    relative_humidity_2m_mean: number[];
  };
}

/**
 * Open-Meteo API Adapter
 *
 * 免費開放天氣 API，無需認証
 * - 預報端點：https://api.open-meteo.com/v1/forecast
 * - 歷史端點：https://archive-api.open-meteo.com/v1/archive
 */
class OpenMeteoAdapter implements WeatherApiAdapter {
  readonly source: WeatherSource = 'open-meteo';

  async fetchWeather(location: Location): Promise<Omit<WeatherData, 'history'>> {
    try {
      const params = new URLSearchParams({
        latitude: String(location.latitude),
        longitude: String(location.longitude),
        current:
          'temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m,precipitation,pressure_msl,visibility',
        hourly:
          'temperature_2m,apparent_temperature,precipitation,weather_code,precipitation_probability,relative_humidity_2m,wind_speed_10m,wind_direction_10m',
        daily:
          'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,sunrise,sunset,wind_speed_10m_max,uv_index_max',
        timezone: 'Asia/Taipei',
        forecast_days: '7',
      });

      const response = await fetch(`${FORECAST_URL}?${params.toString()}`);
      if (!response.ok) {
        throw new WeatherApiError(
          `Open-Meteo 預報 API 失敗: ${response.statusText}`,
          this.source,
          response.status,
        );
      }

      const data: OpenMeteoForecastResponse = await response.json();

      const fetchedAt = new Date().toISOString();
      const current = this.parseCurrentWeather(data.current);
      const hourlyForecast = this.parseHourlyForecast(data.hourly);
      const dailyForecast = this.parseDailyForecast(data.daily);

      return {
        location,
        source: this.source,
        fetchedAt,
        current,
        hourlyForecast,
        dailyForecast,
      };
    } catch (error) {
      if (error instanceof WeatherApiError) {
        throw error;
      }
      throw new WeatherApiError(
        `Open-Meteo 預報取得失敗: ${error instanceof Error ? error.message : '未知錯誤'}`,
        this.source,
        undefined,
        error instanceof Error ? error : undefined,
      );
    }
  }

  /**
   * 取得歷史天氣資料（過去 N 天）
   */
  async fetchHistory(location: Location, days: number): Promise<HistoricalDayWeather[]> {
    try {
      // 計算日期範圍
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days);

      const formatDate = (date: Date): string => date.toISOString().split('T')[0] ?? '';

      const params = new URLSearchParams({
        latitude: String(location.latitude),
        longitude: String(location.longitude),
        start_date: formatDate(startDate),
        end_date: formatDate(endDate),
        daily:
          'weather_code,temperature_2m_max,temperature_2m_min,temperature_2m_mean,precipitation_sum,wind_speed_10m_max,relative_humidity_2m_mean',
        timezone: 'Asia/Taipei',
      });

      const response = await fetch(`${ARCHIVE_URL}?${params.toString()}`);
      if (!response.ok) {
        throw new WeatherApiError(
          `Open-Meteo 歷史資料 API 失敗: ${response.statusText}`,
          this.source,
          response.status,
        );
      }

      const data: OpenMeteoArchiveResponse = await response.json();
      return this.parseHistoryData(data.daily);
    } catch (error) {
      if (error instanceof WeatherApiError) {
        throw error;
      }
      throw new WeatherApiError(
        `Open-Meteo 歷史資料取得失敗: ${error instanceof Error ? error.message : '未知錯誤'}`,
        this.source,
        undefined,
        error instanceof Error ? error : undefined,
      );
    }
  }

  /**
   * 健康檢查
   */
  async healthCheck(): Promise<boolean> {
    try {
      const params = new URLSearchParams({
        latitude: '25.0', // 台北
        longitude: '121.5',
        current: 'temperature_2m',
      });

      const response = await fetch(`${FORECAST_URL}?${params.toString()}`);
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * 解析即時天氣
   */
  private parseCurrentWeather(current: OpenMeteoCurrentWeather): CurrentWeather {
    return {
      timestamp: new Date().toISOString(),
      temperature: current.temperature,
      apparentTemperature: current.apparent_temperature,
      humidity: current.relative_humidity,
      description: getWeatherDescription(current.weathercode),
      weatherCode: current.weathercode,
      windSpeed: current.wind_speed_10m,
      windDirection: current.wind_direction_10m,
      precipitation: current.precipitation,
      pressure: current.pressure_msl || 1013,
      visibility: current.visibility || 10,
    };
  }

  /**
   * 解析逐時預報
   */
  private parseHourlyForecast(hourly: OpenMeteoForecastResponse['hourly']): HourlyForecast[] {
    const forecasts: HourlyForecast[] = [];

    // 取前 72 小時（3 天）
    const limit = Math.min(72, hourly.time.length);

    for (let i = 0; i < limit; i++) {
      const timestamp = hourly.time[i];
      // 跳過無效時間戳
      if (!timestamp) continue;

      forecasts.push({
        timestamp,
        temperature: hourly.temperature_2m[i] ?? 20,
        apparentTemperature: hourly.apparent_temperature[i] ?? 20,
        weatherCode: hourly.weather_code[i] ?? 0,
        description: getWeatherDescription(hourly.weather_code[i] ?? 0),
        precipitationProbability: hourly.precipitation_probability[i] ?? 0,
        precipitation: hourly.precipitation[i] ?? 0,
        humidity: hourly.relative_humidity_2m[i] ?? 50,
        windSpeed: hourly.wind_speed_10m[i] ?? 0,
        windDirection: hourly.wind_direction_10m[i] ?? 0,
      });
    }

    return forecasts;
  }

  /**
   * 解析每日預報
   */
  private parseDailyForecast(daily: OpenMeteoForecastResponse['daily']): DailyForecast[] {
    const forecasts: DailyForecast[] = [];

    for (let i = 0; i < daily.time.length; i++) {
      const date = daily.time[i];
      // 跳過無效日期
      if (!date) continue;

      forecasts.push({
        date,
        temperatureMax: daily.temperature_2m_max[i] ?? 25,
        temperatureMin: daily.temperature_2m_min[i] ?? 15,
        weatherCode: daily.weather_code[i] ?? 0,
        description: getWeatherDescription(daily.weather_code[i] ?? 0),
        precipitationProbability: daily.precipitation_probability_max[i] ?? 0,
        precipitationSum: daily.precipitation_sum[i] ?? 0,
        sunrise: daily.sunrise[i] ?? '06:00',
        sunset: daily.sunset[i] ?? '18:00',
        windSpeedMax: daily.wind_speed_10m_max[i] ?? 0,
        uvIndexMax: daily.uv_index_max?.[i] ?? 0,
      });
    }

    return forecasts;
  }

  /**
   * 解析歷史資料
   */
  private parseHistoryData(daily: OpenMeteoArchiveResponse['daily']): HistoricalDayWeather[] {
    const history: HistoricalDayWeather[] = [];

    for (let i = 0; i < daily.time.length; i++) {
      history.push({
        date: daily.time[i] ?? '',
        temperatureMax: daily.temperature_2m_max[i] ?? 25,
        temperatureMin: daily.temperature_2m_min[i] ?? 15,
        temperatureAvg: daily.temperature_2m_mean[i] ?? 20,
        weatherCode: daily.weather_code[i] ?? 0,
        description: getWeatherDescription(daily.weather_code[i] ?? 0),
        precipitationSum: daily.precipitation_sum[i] ?? 0,
        windSpeedAvg: daily.wind_speed_10m_max[i] ?? 0,
        humidityAvg: daily.relative_humidity_2m_mean[i] ?? 50,
        source: this.source,
      });
    }

    return history;
  }
}

export default new OpenMeteoAdapter();
