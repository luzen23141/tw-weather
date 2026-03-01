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
import { getWeatherDescription, mapWeatherApiCodeToWmo } from '../weather-code.map';

const PROXY_URL = process.env.EXPO_PUBLIC_PROXY_URL;
const WEATHERAPI_KEY = process.env.EXPO_PUBLIC_WEATHERAPI_KEY;
const WEATHERAPI_DIRECT_BASE = 'https://api.weatherapi.com/v1';

function buildWaUrl(endpoint: string, params: Record<string, string>): string {
  if (PROXY_URL) {
    const url = new URL(`${PROXY_URL}/api/proxy`);
    url.searchParams.set('service', 'weatherapi');
    url.searchParams.set('endpoint', endpoint);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    return url.toString();
  }
  const url = new URL(`${WEATHERAPI_DIRECT_BASE}/${endpoint}`);
  if (WEATHERAPI_KEY) url.searchParams.set('key', WEATHERAPI_KEY);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return url.toString();
}

interface WeatherApiHour {
  time: string;
  temp_c: number;
  feelslike_c: number;
  humidity: number;
  condition: { text: string; code: number };
  chance_of_rain: number;
  precip_mm: number;
  wind_kph: number;
  wind_degree: number;
}

interface WeatherApiDay {
  date: string;
  maxtemp_c: number;
  mintemp_c: number;
  avgtemp_c: number;
  condition: { text: string; code: number };
  daily_chance_of_rain: number;
  totalprecip_mm: number;
  maxwind_kph: number;
  sunrise: string;
  sunset: string;
  avg_humidity: number;
  uv: number;
}

interface WeatherApiForecastResponse {
  current: {
    last_updated_epoch: number;
    last_updated: string;
    temp_c: number;
    is_day: number;
    condition: { code: number; text: string; icon: string };
    wind_kph: number;
    wind_degree: number;
    humidity: number;
    feelslike_c: number;
    precip_mm: number;
    pressure_mb: number;
    vis_km: number;
  };
  forecast: {
    forecastday: Array<{
      date: string;
      day: WeatherApiDay;
      astro: { sunrise: string; sunset: string };
      hour: WeatherApiHour[];
    }>;
  };
}

/**
 * WeatherAPI.com Adapter
 *
 * - 預報端點：https://api.weatherapi.com/v1/forecast.json
 * - 歷史端點：https://api.weatherapi.com/v1/history.json
 * - 需要 API Key (EXPO_PUBLIC_WEATHERAPI_KEY)
 */
class WeatherApiComAdapter implements WeatherApiAdapter {
  readonly source: WeatherSource = 'weatherapi';

  async fetchWeather(location: Location): Promise<Omit<WeatherData, 'history'>> {
    if (!PROXY_URL && !WEATHERAPI_KEY) {
      throw new WeatherApiError(
        'WeatherAPI Key 未設定',
        this.source,
        undefined,
        new Error('EXPO_PUBLIC_WEATHERAPI_KEY not found'),
      );
    }

    try {
      const response = await fetch(
        buildWaUrl('forecast.json', {
          q: `${location.latitude},${location.longitude}`,
          days: '7',
          aqi: 'no',
          alerts: 'no',
        }),
      );
      if (!response.ok) {
        throw new WeatherApiError(
          `WeatherAPI 預報 API 失敗: ${response.statusText}`,
          this.source,
          response.status,
        );
      }

      const data: WeatherApiForecastResponse = await response.json();

      const fetchedAt = new Date().toISOString();
      const current = this.parseCurrentWeather(data.current);
      const hourlyForecast = this.parseHourlyForecast(data.forecast.forecastday);
      const dailyForecast = this.parseDailyForecast(data.forecast.forecastday);

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
        `WeatherAPI 預報取得失敗: ${error instanceof Error ? error.message : '未知錯誤'}`,
        this.source,
        undefined,
        error instanceof Error ? error : undefined,
      );
    }
  }

  /**
   * 取得歷史天氣資料（逐日查詢）
   * 免費方案限 7 天內
   */
  async fetchHistory(location: Location, days: number): Promise<HistoricalDayWeather[]> {
    if (!PROXY_URL && !WEATHERAPI_KEY) {
      throw new WeatherApiError(
        'WeatherAPI Key 未設定',
        this.source,
        undefined,
        new Error('EXPO_PUBLIC_WEATHERAPI_KEY not found'),
      );
    }

    try {
      const history: HistoricalDayWeather[] = [];
      const now = new Date();

      // 逐日查詢（最多往回 7 天，受免費方案限制）
      const queryDays = Math.min(days, 7);

      for (let i = 1; i <= queryDays; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0] ?? '';

        const response = await fetch(
          buildWaUrl('history.json', {
            q: `${location.latitude},${location.longitude}`,
            dt: dateStr,
          }),
        );
        if (!response.ok) {
          // 某一天失敗時，繼續查詢其他日期
          console.warn(`WeatherAPI 歷史資料 ${dateStr} 查詢失敗`);
          continue;
        }

        const data: WeatherApiForecastResponse = await response.json();
        const day = data.forecast.forecastday[0]?.day;

        if (day) {
          const weatherCode = mapWeatherApiCodeToWmo(day.condition.code);
          history.push({
            date: dateStr,
            temperatureMax: day.maxtemp_c,
            temperatureMin: day.mintemp_c,
            temperatureAvg: day.avgtemp_c,
            weatherCode,
            description: getWeatherDescription(weatherCode),
            precipitationSum: day.totalprecip_mm,
            windSpeedAvg: day.maxwind_kph,
            humidityAvg: day.avg_humidity,
            source: this.source,
          });
        }
      }

      return history.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } catch (error) {
      if (error instanceof WeatherApiError) {
        throw error;
      }
      throw new WeatherApiError(
        `WeatherAPI 歷史資料取得失敗: ${error instanceof Error ? error.message : '未知錯誤'}`,
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
    if (!PROXY_URL && !WEATHERAPI_KEY) {
      return false;
    }

    try {
      const response = await fetch(buildWaUrl('current.json', { q: '25.0,121.5' }));
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * 解析即時天氣
   */
  private parseCurrentWeather(current: WeatherApiForecastResponse['current']): CurrentWeather {
    const weatherCode = mapWeatherApiCodeToWmo(current.condition.code);

    return {
      timestamp: new Date(current.last_updated).toISOString(),
      temperature: current.temp_c,
      apparentTemperature: current.feelslike_c,
      humidity: current.humidity,
      description: getWeatherDescription(weatherCode),
      weatherCode,
      windSpeed: current.wind_kph,
      windDirection: current.wind_degree,
      precipitation: current.precip_mm,
      pressure: current.pressure_mb,
      visibility: current.vis_km,
    };
  }

  /**
   * 解析逐時預報（取前 72 小時）
   */
  private parseHourlyForecast(
    forecastdays: WeatherApiForecastResponse['forecast']['forecastday'],
  ): HourlyForecast[] {
    const forecasts: HourlyForecast[] = [];

    let hourCount = 0;
    for (const day of forecastdays) {
      for (const hour of day.hour) {
        if (hourCount >= 72) break;

        const weatherCode = mapWeatherApiCodeToWmo(hour.condition.code);
        forecasts.push({
          timestamp: hour.time,
          temperature: hour.temp_c,
          apparentTemperature: hour.feelslike_c,
          weatherCode,
          description: getWeatherDescription(weatherCode),
          precipitationProbability: hour.chance_of_rain,
          precipitation: hour.precip_mm,
          humidity: hour.humidity,
          windSpeed: hour.wind_kph,
          windDirection: hour.wind_degree,
        });

        hourCount++;
      }
      if (hourCount >= 72) break;
    }

    return forecasts;
  }

  /**
   * 解析每日預報
   */
  private parseDailyForecast(
    forecastdays: WeatherApiForecastResponse['forecast']['forecastday'],
  ): DailyForecast[] {
    return forecastdays.map((day) => {
      const weatherCode = mapWeatherApiCodeToWmo(day.day.condition.code);

      return {
        date: day.date,
        temperatureMax: day.day.maxtemp_c,
        temperatureMin: day.day.mintemp_c,
        weatherCode,
        description: getWeatherDescription(weatherCode),
        precipitationProbability: day.day.daily_chance_of_rain,
        precipitationSum: day.day.totalprecip_mm,
        sunrise: day.astro.sunrise,
        sunset: day.astro.sunset,
        windSpeedMax: day.day.maxwind_kph,
        uvIndexMax: day.day.uv,
      };
    });
  }
}

export default new WeatherApiComAdapter();
