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

import { mapCwaCodeToWmo, getWeatherDescription } from '@/utils/weather-code';

const PROXY_URL = process.env.EXPO_PUBLIC_PROXY_URL;
const CWA_API_KEY = process.env.EXPO_PUBLIC_CWA_API_KEY;
const CWA_DIRECT_BASE = 'https://opendata.cwa.gov.tw/api/v1/rest/datastore';

/**
 * 從能見度描述文字提取數值（km）
 * 範例："10 km", "5公里", "不良" → 10, 5, 或預設值
 */
function parseVisibilityDescription(desc: string | undefined): number {
  if (!desc) return 10;
  const match = desc.match(/(\d+(?:\.\d+)?)/);
  if (match && match[1]) {
    return parseFloat(match[1]);
  }
  return 10;
}

/**
 * 計算體感溫度（簡化版：使用風寒指數 Wind Chill Index）
 * 公式參考：NWS Wind Chill
 * 僅適用於溫度 <= 10°C 的情況
 */
function calculateApparentTemperature(
  temperature: number,
  windSpeed: number, // km/h
): number {
  // 若溫度過高或風速過低，直接回傳氣溫
  if (temperature > 10 || windSpeed < 4.8) {
    return temperature;
  }

  // 風寒指數公式 (T in °C, V in km/h)
  // Tw = 13.12 + 0.6215*T - 11.37*V^0.16 + 0.3965*T*V^0.16
  const T = temperature;
  const V = windSpeed;
  const Tw = 13.12 + 0.6215 * T - 11.37 * Math.pow(V, 0.16) + 0.3965 * T * Math.pow(V, 0.16);

  return Math.round(Tw * 10) / 10; // 保留一位小數
}

/**
 * 從天氣描述文字反查 CWA 天氣代碼
 * 使用簡單的字詞比對
 */
function getWeatherCodeFromDescription(description: string | undefined): number {
  if (!description) return 3; // 預設多雲

  const desc = description.toLowerCase();

  // 依序檢查，優先匹配更精確的條件
  if (desc.includes('晴')) return 1;
  if (desc.includes('雪')) {
    if (desc.includes('陣')) return 16; // 陣小雪
    if (desc.includes('大')) return 20; // 大雪
    return 7; // 小雪
  }
  if (desc.includes('雨')) {
    if (desc.includes('陣')) return 8; // 陣雨
    if (desc.includes('凍')) return 18; // 凍雨
    if (desc.includes('雷')) return 21; // 雷暴伴隨冰雹
    return 6; // 雨
  }
  if (desc.includes('霧')) {
    if (desc.includes('濃')) return 10; // 濃霧
    return 4; // 霧
  }
  if (desc.includes('多雲') || desc.includes('多云')) return 2;
  if (desc.includes('陰') || desc.includes('阴')) return 3;
  if (desc.includes('雷')) return 9; // 雷暴

  return 3; // 預設多雲
}

function buildCwaUrl(endpoint: string, params: Record<string, string>): URL {
  if (PROXY_URL) {
    const url = new URL(`${PROXY_URL}/api/proxy`);
    url.searchParams.set('service', 'cwa');
    url.searchParams.set('endpoint', endpoint);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    return url;
  }
  const url = new URL(`${CWA_DIRECT_BASE}/${endpoint}`);
  if (CWA_API_KEY) url.searchParams.set('Authorization', CWA_API_KEY);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return url;
}

interface CwaApiResponse<T = unknown> {
  success: boolean;
  result?: {
    fields?: Array<{ id: string; type: string }>;
  };
  records?: T;
  status?: number;
}

interface CwaWeatherElement {
  ElementName: string; // 例如: "溫度", "12小時降雨機率", "風速", "天氣現象"
  Time?: Array<{
    DataTime?: string; // 逐時的 datetime
    StartTime?: string; // 區間起始
    EndTime?: string; // 區間結束
    ElementValue?: Array<{
      Temperature?: string;
      ProbabilityOfPrecipitation?: string;
      RelativeHumidity?: string;
      WindDirection?: string;
      WindSpeed?: string;
      Weather?: string;
      WeatherCode?: string;
    }>;
  }>;
}

interface CwaStationCoordinates {
  StationLatitude?: string;
  StationLongitude?: string;
  Coordinates?: string;
}

interface CwaStation {
  StationName?: string;
  GeoInfo?: CwaStationCoordinates;
  ObsTime?: { DateTime?: string };
  WeatherElement?: {
    Weather?: string;
    Now?: { Precipitation?: string };
    WindDirection?: string;
    WindSpeed?: string;
    AirTemperature?: string;
    RelativeHumidity?: string;
    AirPressure?: string;
    VisibilityDescription?: string;
  };
}

function parseStationCoordinate(value: string | undefined): number | null {
  if (!value) return null;
  const match = value.match(/-?\d+(?:\.\d+)?/);
  if (!match || !match[0]) return null;
  const parsed = Number.parseFloat(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

function getStationCoordinates(
  station: CwaStation,
): { latitude: number; longitude: number } | null {
  const latitude = parseStationCoordinate(station.GeoInfo?.StationLatitude);
  const longitude = parseStationCoordinate(station.GeoInfo?.StationLongitude);

  if (latitude !== null && longitude !== null) {
    return { latitude, longitude };
  }

  const coordinates = station.GeoInfo?.Coordinates?.split(',') ?? [];
  const fallbackLatitude = parseStationCoordinate(coordinates[0]?.trim());
  const fallbackLongitude = parseStationCoordinate(coordinates[1]?.trim());

  if (fallbackLatitude !== null && fallbackLongitude !== null) {
    return { latitude: fallbackLatitude, longitude: fallbackLongitude };
  }

  return null;
}

function calculateDistanceKm(
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number },
): number {
  const toRadians = (degree: number): number => (degree * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const latDelta = toRadians(to.latitude - from.latitude);
  const lonDelta = toRadians(to.longitude - from.longitude);
  const fromLatitude = toRadians(from.latitude);
  const toLatitude = toRadians(to.latitude);

  const a =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(fromLatitude) * Math.cos(toLatitude) * Math.sin(lonDelta / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function selectNearestStation(
  location: Location,
  stations: CwaStation[],
): CwaStation | null {
  if (stations.length === 0) return null;

  const stationsWithDistance = stations
    .map((station) => {
      const coordinates = getStationCoordinates(station);
      if (!coordinates || !station.WeatherElement) {
        return null;
      }

      return {
        station,
        distance: calculateDistanceKm(location, coordinates),
      };
    })
    .filter(
      (
        entry,
      ): entry is {
        station: CwaStation;
        distance: number;
      } => entry !== null,
    )
    .sort((left, right) => left.distance - right.distance);

  return (
    stationsWithDistance[0]?.station ?? stations.find((station) => station.WeatherElement) ?? null
  );
}

/**
 * CWA (中央氣象署) API Adapter
 *
 * 端點：
 * - F-D0047-089：3日逐3小時預報
 * - F-D0047-091：1週預報
 * - O-A0001-001：自動氣象站即時觀測
 */
class CwaAdapter implements WeatherApiAdapter {
  readonly source: WeatherSource = 'cwa';

  async fetchWeather(location: Location): Promise<Omit<WeatherData, 'history'>> {
    if (!PROXY_URL && !CWA_API_KEY) {
      throw new WeatherApiError(
        'CWA API Key 未設定',
        this.source,
        undefined,
        new Error('EXPO_PUBLIC_CWA_API_KEY not found'),
      );
    }

    try {
      // 並行取得三個端點資料
      const [currentRes, hourlyRes, dailyRes] = await Promise.all([
        this.fetchCurrentWeather(location),
        this.fetchHourlyForecast(location),
        this.fetchDailyForecast(location),
      ]);

      const fetchedAt = new Date().toISOString();

      return {
        location,
        source: this.source,
        fetchedAt,
        current: currentRes,
        hourlyForecast: hourlyRes,
        dailyForecast: dailyRes,
      };
    } catch (error) {
      if (error instanceof WeatherApiError) {
        throw error;
      }
      throw new WeatherApiError(
        `CWA 預報取得失敗: ${error instanceof Error ? error.message : '未知錯誤'}`,
        this.source,
        undefined,
        error instanceof Error ? error : undefined,
      );
    }
  }

  private getLocationNameCandidates(location: Location): string[] {
    const candidates = [location.district, location.city, location.name].filter(
      (value): value is string => Boolean(value && value.trim()),
    );

    return Array.from(new Set(candidates));
  }

  /**
   * 取得即時天氣 (O-A0001-001)
   */
  private async fetchCurrentWeather(location: Location): Promise<CurrentWeather> {
    const url = buildCwaUrl('O-A0001-001', { format: 'JSON' });

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new WeatherApiError(
        `CWA 即時觀測 API 失敗: ${response.statusText}`,
        this.source,
        response.status,
      );
    }

    const data: CwaApiResponse<{ Station?: CwaStation[] }> = await response.json();
    if (!data.success || !data.records) {
      throw new WeatherApiError(
        'CWA 即時觀測回傳無效',
        this.source,
        undefined,
        new Error(`API response: success=${data.success}, hasRecords=${!!data.records}`),
      );
    }

    const stations = data.records.Station;
    if (!stations || stations.length === 0) {
      throw new WeatherApiError(
        'CWA 無法取得觀測資料',
        this.source,
        undefined,
        new Error('No station data found'),
      );
    }

    const station = selectNearestStation(location, stations);
    if (!station || !station.WeatherElement) {
      throw new WeatherApiError(
        'CWA 無法取得觀測資料',
        this.source,
        undefined,
        new Error('No station or WeatherElement data found'),
      );
    }

    const obs = station.WeatherElement;
    const temperature = parseFloat(obs.AirTemperature ?? '') || 20;
    const windSpeed = parseFloat(obs.WindSpeed ?? '') || 0;

    // 從天氣描述反查天氣代碼
    const cwaCodeFromDesc = getWeatherCodeFromDescription(obs.Weather);
    const weatherCode = mapCwaCodeToWmo(cwaCodeFromDesc);

    return {
      timestamp: station.ObsTime?.DateTime ?? new Date().toISOString(),
      temperature,
      // 使用風寒指數計算體感溫度
      apparentTemperature: calculateApparentTemperature(temperature, windSpeed),
      humidity: parseFloat(obs.RelativeHumidity ?? '') || 50,
      description: obs.Weather || getWeatherDescription(weatherCode),
      weatherCode,
      windSpeed,
      windDirection: parseFloat(obs.WindDirection ?? '') || 0,
      precipitation: parseFloat(obs.Now?.Precipitation ?? '') || 0,
      // TODO: CWA 即時觀測 API 未提供降雨機率，預設為 0
      precipitationProbability: 0,
      pressure: parseFloat(obs.AirPressure ?? '') || 1013,
      // 從 VisibilityDescription 解析能見度
      visibility: parseVisibilityDescription(obs.VisibilityDescription),
    };
  }

  /**
   * 取得 3 日逐 3 小時預報 (F-D0047-089)
   */
  private async fetchHourlyForecast(location: Location): Promise<HourlyForecast[]> {
    const locationNames = this.getLocationNameCandidates(location);

    let records: CwaWeatherElement[] = [];

    for (const locationName of locationNames) {
      const url = buildCwaUrl('F-D0047-089', {
        format: 'JSON',
        LocationName: locationName,
      });

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new WeatherApiError(
          `CWA 逐時預報 API 失敗: ${response.statusText}`,
          this.source,
          response.status,
        );
      }

      const data: CwaApiResponse<{
        Locations?: Array<{ Location?: Array<{ WeatherElement?: CwaWeatherElement[] }> }>;
      }> = await response.json();
      if (!data.success || !data.records) {
        throw new WeatherApiError(
          'CWA 逐時預報回傳無效',
          this.source,
          undefined,
          new Error(`API response: success=${data.success}, hasRecords=${!!data.records}`),
        );
      }

      records = Array.isArray(data.records)
        ? data.records
        : (data.records.Locations?.[0]?.Location?.[0]?.WeatherElement ?? []);

      if (records.length > 0) {
        break;
      }
    }

    const hourlyForecasts: HourlyForecast[] = [];
    const timeElement = records.find((el: CwaWeatherElement) => el.ElementName === '溫度');
    const popElement = records.find((el: CwaWeatherElement) => el.ElementName === '3小時降雨機率');
    const rhElement = records.find((el: CwaWeatherElement) => el.ElementName === '相對濕度');
    const wsElement = records.find((el: CwaWeatherElement) => el.ElementName === '風速');
    const wdElement = records.find((el: CwaWeatherElement) => el.ElementName === '風向');
    const wxElement = records.find((el: CwaWeatherElement) => el.ElementName === '天氣現象');
    const atElement = records.find((el: CwaWeatherElement) => el.ElementName === '體感溫度');

    if (!timeElement || !timeElement.Time) {
      return [];
    }

    const times = timeElement.Time;
    if (times.length === 0) {
      return [];
    }

    times
      .slice(0, 24)
      .forEach((timeObj: NonNullable<CwaWeatherElement['Time']>[0], idx: number) => {
        // 在新版結構中，天氣代碼通常在 WeatherCode 或只給出描述，此處以 WeatherCode 解析，如果沒有給預設 3
        const wxVal = wxElement?.Time?.[idx]?.ElementValue?.[0];
        const codeStr = wxVal?.WeatherCode ?? '3';
        const weatherCode = mapCwaCodeToWmo(codeStr);
        const desc = wxVal?.Weather || getWeatherDescription(weatherCode);

        // 解析降雨機率
        // CWA 降雨機率通常以 6 小時或 12 小時為單位，需要向上對齊
        // 計算映射到降雨機率元素的索引
        const popIndex = Math.min(Math.floor(idx / 2), (popElement?.Time?.length ?? 1) - 1);
        const popStr =
          popElement?.Time?.[popIndex]?.ElementValue?.[0]?.ProbabilityOfPrecipitation ?? '0';
        const popValue = parseInt(popStr === ' ' ? '0' : popStr, 10) || 0;

        hourlyForecasts.push({
          timestamp: timeObj.DataTime ?? timeObj.StartTime ?? new Date().toISOString(),
          temperature: parseFloat(timeObj.ElementValue?.[0]?.Temperature ?? '20'),
          apparentTemperature: parseFloat(
            atElement?.Time?.[idx]?.ElementValue?.[0]?.Temperature ?? '20',
          ),
          weatherCode,
          description: desc,
          precipitationProbability: Math.max(0, Math.min(100, popValue)), // 確保在 0-100 範圍內
          precipitation: 0, // 3小時降雨機率API常未提供累積雨量
          humidity: parseInt(
            rhElement?.Time?.[idx]?.ElementValue?.[0]?.RelativeHumidity ?? '50',
            10,
          ),
          windSpeed: parseFloat(wsElement?.Time?.[idx]?.ElementValue?.[0]?.WindSpeed ?? '0'),
          windDirection: parseFloat(
            wdElement?.Time?.[idx]?.ElementValue?.[0]?.WindDirection ?? '0',
          ),
        });
      });

    return hourlyForecasts;
  }

  /**
   * 取得 1 週預報 (F-D0047-091)
   */
  private async fetchDailyForecast(location: Location): Promise<DailyForecast[]> {
    const locationNames = this.getLocationNameCandidates(location);

    let weatherElements: CwaWeatherElement[] = [];

    for (const locationName of locationNames) {
      const url = buildCwaUrl('F-D0047-091', {
        format: 'JSON',
        LocationName: locationName,
      });

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new WeatherApiError(
          `CWA 每日預報 API 失敗: ${response.statusText}`,
          this.source,
          response.status,
        );
      }

      const data: CwaApiResponse<{
        Locations?: Array<{ Location?: Array<{ WeatherElement?: CwaWeatherElement[] }> }>;
      }> = await response.json();
      if (!data.success || !data.records) {
        throw new WeatherApiError(
          'CWA 每日預報回傳無效',
          this.source,
          undefined,
          new Error(`API response: success=${data.success}, hasRecords=${!!data.records}`),
        );
      }

      const locations = Array.isArray(data.records)
        ? []
        : (data.records.Locations?.[0]?.Location ?? []);
      weatherElements = locations[0]?.WeatherElement ?? [];

      if (weatherElements.length > 0) {
        break;
      }
    }

    const dailyForecasts: DailyForecast[] = [];

    const popElement = weatherElements.find(
      (el: CwaWeatherElement) => el.ElementName === '12小時降雨機率',
    );
    const wxElement = weatherElements.find(
      (el: CwaWeatherElement) => el.ElementName === '天氣現象',
    );
    const maxTElement = weatherElements.find(
      (el: CwaWeatherElement) => el.ElementName === '最高溫度',
    );
    const minTElement = weatherElements.find(
      (el: CwaWeatherElement) => el.ElementName === '最低溫度',
    );

    // 由於每日預報的顆粒度是12小時，比較粗略，改為取第一天的值直接映射
    // 我們只取未來7天
    type CwaElementValue = NonNullable<
      NonNullable<CwaWeatherElement['Time']>[0]['ElementValue']
    >[0];
    const dateMap = new Map<string, Partial<DailyForecast>>();

    const processElement = (
      element: CwaWeatherElement | undefined,
      fieldExtractor: (val: CwaElementValue) => number | string,
      fieldName: keyof DailyForecast,
    ) => {
      element?.Time?.forEach((t) => {
        const date = (t.StartTime ?? '').split('T')[0];
        if (!date) return;
        const val = t.ElementValue?.[0];
        if (!val) return;
        if (!dateMap.has(date)) dateMap.set(date, { date });

        const extracted = fieldExtractor(val);
        const currentObj = dateMap.get(date);
        if (!currentObj) return;

        // 若為數值且需取 max / min (例如最高溫度)
        if (fieldName === 'temperatureMax') {
          currentObj[fieldName] = Math.max(currentObj[fieldName] ?? -999, extracted as number);
        } else if (fieldName === 'temperatureMin') {
          currentObj[fieldName] = Math.min(currentObj[fieldName] ?? 999, extracted as number);
        } else if (fieldName === 'precipitationProbability') {
          currentObj[fieldName] = Math.max(currentObj[fieldName] ?? 0, (extracted as number) || 0);
        } else if (currentObj[fieldName] === undefined) {
          (currentObj as Record<string, unknown>)[fieldName] = extracted;
        }
      });
    };

    processElement(maxTElement, (v) => parseFloat(v.Temperature ?? '25'), 'temperatureMax');
    processElement(minTElement, (v) => parseFloat(v.Temperature ?? '15'), 'temperatureMin');
    processElement(
      popElement,
      (v) => {
        const p = v.ProbabilityOfPrecipitation ?? '0';
        return parseInt(p === ' ' ? '0' : p, 10);
      },
      'precipitationProbability',
    );
    processElement(wxElement, (v) => mapCwaCodeToWmo(v.WeatherCode ?? '3'), 'weatherCode');
    processElement(wxElement, (v) => v.Weather ?? '', 'description');

    const sortedDates = Array.from(dateMap.keys()).sort().slice(0, 7);
    sortedDates.forEach((date) => {
      const obj = dateMap.get(date);
      if (!obj) return;
      dailyForecasts.push({
        date,
        temperatureMax:
          obj.temperatureMax !== -999 && obj.temperatureMax !== undefined ? obj.temperatureMax : 25,
        temperatureMin:
          obj.temperatureMin !== 999 && obj.temperatureMin !== undefined ? obj.temperatureMin : 15,
        weatherCode: obj.weatherCode || 3,
        description: obj.description || getWeatherDescription(obj.weatherCode || 3),
        precipitationProbability: obj.precipitationProbability || 0,
        // TODO: CWA API 未提供每日累積降雨量，預設為 0
        precipitationSum: 0,
        // TODO: CWA API 未提供日出日落時間，保留預設值
        sunrise: '06:00',
        sunset: '18:00',
        // TODO: CWA API 未提供每日最大風速，預設為 0
        windSpeedMax: 0,
      });
    });

    return dailyForecasts;
  }

  /**
   * CWA 不提供歷史天氣 API，回傳空陣列
   */
  async fetchHistory?(): Promise<HistoricalDayWeather[]> {
    return [];
  }

  /**
   * 健康檢查：呼叫即時觀測端點
   */
  async healthCheck(): Promise<boolean> {
    if (!PROXY_URL && !CWA_API_KEY) {
      return false;
    }

    try {
      const url = buildCwaUrl('O-A0001-001', { format: 'JSON', limit: '1' });

      const response = await fetch(url.toString());
      return response.ok;
    } catch {
      return false;
    }
  }
}

export default new CwaAdapter();
