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
import { getWeatherDescription, mapOpenWeatherMapCodeToWmo } from '../weather-code.map';

const PROXY_URL = process.env.EXPO_PUBLIC_PROXY_URL;
const OPENWEATHERMAP_KEY = process.env.EXPO_PUBLIC_OPENWEATHERMAP_KEY;
const OWM_DIRECT_BASE = 'https://api.openweathermap.org';

function buildOwmUrl(endpoint: string, params: Record<string, string>): string {
  if (PROXY_URL) {
    const url = new URL(`${PROXY_URL}/api/proxy`);
    url.searchParams.set('service', 'openweathermap');
    url.searchParams.set('endpoint', endpoint);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    return url.toString();
  }
  const url = new URL(`${OWM_DIRECT_BASE}/${endpoint}`);
  if (OPENWEATHERMAP_KEY) url.searchParams.set('appid', OPENWEATHERMAP_KEY);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return url.toString();
}

interface OwmWeatherResponse {
  dt: number;
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
  };
  wind: { speed: number; deg: number };
  weather: Array<{ id: number; main: string; description: string }>;
  clouds?: { all: number };
  rain?: { '1h'?: number; '3h'?: number };
  snow?: { '1h'?: number; '3h'?: number };
  visibility?: number;
  sys?: { sunrise?: number; sunset?: number };
}

interface OwmForecastResponse {
  list: Array<{
    dt: number;
    main: {
      temp: number;
      feels_like: number;
      temp_min: number;
      temp_max: number;
      pressure: number;
      humidity: number;
    };
    weather: Array<{ id: number; main: string; description: string }>;
    clouds?: { all: number };
    wind: { speed: number; deg: number };
    visibility?: number;
    pop: number;
    rain?: { '3h'?: number };
    snow?: { '3h'?: number };
    dt_txt: string;
  }>;
  city: {
    sunrise: number;
    sunset: number;
  };
}

/**
 * OpenWeatherMap Adapter
 *
 * - 使用免費 2.5 API：data/2.5/weather 與 data/2.5/forecast
 * - 需要 API Key (EXPO_PUBLIC_OPENWEATHERMAP_KEY)
 * - 不支援歷史查詢（需付費版本）
 */
class OpenWeatherMapAdapter implements WeatherApiAdapter {
  readonly source: WeatherSource = 'openweathermap';

  async fetchWeather(location: Location): Promise<Omit<WeatherData, 'history'>> {
    if (!PROXY_URL && !OPENWEATHERMAP_KEY) {
      throw new WeatherApiError(
        'OpenWeatherMap API key not configured',
        this.source,
        undefined,
        new Error('EXPO_PUBLIC_OPENWEATHERMAP_KEY not set'),
      );
    }

    try {
      const params = {
        lat: location.latitude.toString(),
        lon: location.longitude.toString(),
        units: 'metric',
      };

      const [weatherRes, forecastRes] = await Promise.all([
        fetch(buildOwmUrl('data/2.5/weather', params)),
        fetch(buildOwmUrl('data/2.5/forecast', params)),
      ]);

      if (!weatherRes.ok || !forecastRes.ok) {
        const errorText = await (weatherRes.ok ? forecastRes.text() : weatherRes.text());
        throw new WeatherApiError(
          `OpenWeatherMap API error: Current(${weatherRes.status}), Forecast(${forecastRes.status}). ${errorText}`,
          this.source,
          weatherRes.ok ? forecastRes.status : weatherRes.status,
        );
      }

      const weatherData: OwmWeatherResponse = await weatherRes.json();
      const forecastData: OwmForecastResponse = await forecastRes.json();

      const currentWeather = this.parseCurrentWeather(weatherData);
      const hourlyForecast = this.parseHourlyForecast(forecastData.list);
      const dailyForecast = this.parseDailyForecast(forecastData.list, forecastData.city);

      return {
        location,
        source: this.source,
        fetchedAt: new Date().toISOString(),
        current: currentWeather,
        hourlyForecast,
        dailyForecast,
      };
    } catch (error) {
      if (error instanceof WeatherApiError) throw error;
      throw new WeatherApiError(
        `Failed to fetch weather from OpenWeatherMap: ${error instanceof Error ? error.message : String(error)}`,
        this.source,
        undefined,
        error instanceof Error ? error : undefined,
      );
    }
  }

  async fetchHistory(): Promise<HistoricalDayWeather[]> {
    // OpenWeatherMap 免費版不支援歷史查詢
    return [];
  }

  async healthCheck(): Promise<boolean> {
    if (!PROXY_URL && !OPENWEATHERMAP_KEY) return false;

    try {
      const response = await fetch(
        buildOwmUrl('data/2.5/weather', { lat: '25.0330', lon: '121.5654' }),
      );
      return response.ok;
    } catch {
      return false;
    }
  }

  private parseCurrentWeather(data: OwmWeatherResponse): CurrentWeather {
    const weatherCode = data.weather[0]?.id ?? 0;
    const wmoCode = mapOpenWeatherMapCodeToWmo(weatherCode);

    const current: CurrentWeather = {
      timestamp: new Date(data.dt * 1000).toISOString(),
      temperature: Math.round(data.main.temp * 10) / 10,
      apparentTemperature: Math.round(data.main.feels_like * 10) / 10,
      humidity: data.main.humidity,
      description: getWeatherDescription(wmoCode),
      weatherCode: wmoCode,
      windSpeed: Math.round(data.wind.speed * 10) / 10,
      windDirection: data.wind.deg,
      precipitation:
        (data.rain?.['1h'] ?? data.rain?.['3h'] ?? 0) +
        (data.snow?.['1h'] ?? data.snow?.['3h'] ?? 0),
      // 免費版 2.5 API 無法直接取得 UV 指數，uvIndex 為 optional 故省略
      ...(data.visibility !== undefined ? { visibility: data.visibility / 1000 } : {}),
      pressure: data.main.pressure,
    };
    return current;
  }

  private parseHourlyForecast(list: OwmForecastResponse['list']): HourlyForecast[] {
    return list.slice(0, 24).map((item) => {
      // 5-day / 3-hour forecast, so 24 items = 3 days
      const weatherCode = item.weather[0]?.id ?? 0;
      const wmoCode = mapOpenWeatherMapCodeToWmo(weatherCode);

      return {
        timestamp: new Date(item.dt * 1000).toISOString(),
        temperature: Math.round(item.main.temp * 10) / 10,
        apparentTemperature: Math.round(item.main.feels_like * 10) / 10,
        weatherCode: wmoCode,
        description: getWeatherDescription(wmoCode),
        precipitationProbability: Math.round(item.pop * 100),
        precipitation: (item.rain?.['3h'] ?? 0) + (item.snow?.['3h'] ?? 0),
        humidity: item.main.humidity,
        windSpeed: Math.round(item.wind.speed * 10) / 10,
        windDirection: item.wind.deg,
      };
    });
  }

  private parseDailyForecast(
    list: OwmForecastResponse['list'],
    city: OwmForecastResponse['city'],
  ): DailyForecast[] {
    // 以 YYYY-MM-DD 為 Key 進行分組聚合
    const dailyMap = new Map<
      string,
      {
        temps: number[];
        codes: number[];
        pops: number[];
        precipTotal: number;
        windSpeeds: number[];
      }
    >();

    for (const item of list) {
      const dt = new Date(item.dt * 1000);
      const dateStr = dt.toISOString().split('T')[0] ?? '';

      if (!dailyMap.has(dateStr)) {
        dailyMap.set(dateStr, {
          temps: [],
          codes: [],
          pops: [],
          precipTotal: 0,
          windSpeeds: [],
        });
      }

      const entry = dailyMap.get(dateStr);
      if (!entry) continue;

      entry.temps.push(item.main.temp_max, item.main.temp_min);
      entry.codes.push(item.weather[0]?.id ?? 0);
      entry.pops.push(item.pop);
      entry.precipTotal += (item.rain?.['3h'] ?? 0) + (item.snow?.['3h'] ?? 0);
      entry.windSpeeds.push(item.wind.speed);
    }

    const result: DailyForecast[] = [];

    // 將 Map 轉換成 DailyForecast
    dailyMap.forEach((entry, dateStr) => {
      // 找出最頻繁出現的 weather code 或取第一個
      const dominantCode = entry.codes[Math.floor(entry.codes.length / 2)] ?? 0;
      const wmoCode = mapOpenWeatherMapCodeToWmo(dominantCode);

      const tMax = Math.max(...entry.temps);
      const tMin = Math.min(...entry.temps);
      const pMax = Math.max(...entry.pops);
      const wMax = Math.max(...entry.windSpeeds);

      result.push({
        date: dateStr,
        temperatureMax: Math.round(tMax * 10) / 10,
        temperatureMin: Math.round(tMin * 10) / 10,
        weatherCode: wmoCode,
        description: getWeatherDescription(wmoCode),
        precipitationProbability: Math.round(pMax * 100),
        precipitationSum: Math.round(entry.precipTotal * 10) / 10,
        sunrise: new Date((city.sunrise ?? 0) * 1000).toISOString(),
        sunset: new Date((city.sunset ?? 0) * 1000).toISOString(),
        windSpeedMax: Math.round(wMax * 10) / 10,
      });
    });

    // 依照日期排序並只取未來 5 天 (通常 forecast 是 5天)
    result.sort((a, b) => a.date.localeCompare(b.date));
    return result.slice(0, 5);
  }
}

export default new OpenWeatherMapAdapter();
