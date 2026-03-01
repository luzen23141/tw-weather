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
import { mapCwaCodeToWmo, getWeatherDescription } from '../weather-code.map';

const PROXY_URL = process.env.EXPO_PUBLIC_PROXY_URL;
const CWA_API_KEY = process.env.EXPO_PUBLIC_CWA_API_KEY;
const CWA_DIRECT_BASE = 'https://opendata.cwa.gov.tw/api/v1/rest/datastore';

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

interface CwaStation {
  StationName?: string;
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
        this.fetchCurrentWeather(),
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

  /**
   * 取得即時天氣 (O-A0001-001)
   */
  private async fetchCurrentWeather(): Promise<CurrentWeather> {
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

    const station = data.records.Station?.[0];
    if (!station || !station.WeatherElement) {
      throw new WeatherApiError(
        'CWA 無法取得觀測資料',
        this.source,
        undefined,
        new Error('No station or WeatherElement data found'),
      );
    }

    const obs = station.WeatherElement;
    // CWA 即時天氣現象代碼在新版 API 需要特殊對照，若無則預設為 多雲(3)
    const weatherCode = mapCwaCodeToWmo(3);

    return {
      timestamp: station.ObsTime?.DateTime ?? new Date().toISOString(),
      temperature: parseFloat(obs.AirTemperature ?? '') || 20,
      apparentTemperature: parseFloat(obs.AirTemperature ?? '') || 20, // 暫代
      humidity: parseFloat(obs.RelativeHumidity ?? '') || 50,
      description: obs.Weather || getWeatherDescription(weatherCode),
      weatherCode,
      windSpeed: parseFloat(obs.WindSpeed ?? '') || 0,
      windDirection: parseFloat(obs.WindDirection ?? '') || 0,
      precipitation: parseFloat(obs.Now?.Precipitation ?? '') || 0,
      precipitationProbability: 0,
      pressure: parseFloat(obs.AirPressure ?? '') || 1013,
      visibility: 10, // 暫代
    };
  }

  /**
   * 取得 3 日逐 3 小時預報 (F-D0047-089)
   */
  private async fetchHourlyForecast(location: Location): Promise<HourlyForecast[]> {
    const url = buildCwaUrl('F-D0047-089', {
      format: 'JSON',
      LocationName: location.district || location.city || location.name,
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

    const records: CwaWeatherElement[] = Array.isArray(data.records)
      ? data.records
      : (data.records.Locations?.[0]?.Location?.[0]?.WeatherElement ?? []);

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

        // 解析降雨機率 (因為降雨機率的間距是6小時或12小時一筆，所以可能找不到剛好對應的idx，我們用簡單映射或直接取0)
        const popStr =
          popElement?.Time?.[Math.floor(idx / 2)]?.ElementValue?.[0]?.ProbabilityOfPrecipitation ??
          '0';

        hourlyForecasts.push({
          timestamp: timeObj.DataTime ?? timeObj.StartTime ?? new Date().toISOString(),
          temperature: parseFloat(timeObj.ElementValue?.[0]?.Temperature ?? '20'),
          apparentTemperature: parseFloat(
            atElement?.Time?.[idx]?.ElementValue?.[0]?.Temperature ?? '20',
          ),
          weatherCode,
          description: desc,
          precipitationProbability: parseInt(popStr === ' ' ? '0' : popStr, 10) || 0,
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
    const url = buildCwaUrl('F-D0047-091', {
      format: 'JSON',
      LocationName: location.district || location.city || location.name,
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

    const dailyForecasts: DailyForecast[] = [];

    // 簡化邏輯：從 records 解析每日預報
    const locations = Array.isArray(data.records)
      ? []
      : (data.records.Locations?.[0]?.Location ?? []);

    const weatherElements: CwaWeatherElement[] = locations[0]?.WeatherElement ?? [];

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
        precipitationSum: 0,
        sunrise: '06:00',
        sunset: '18:00',
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
