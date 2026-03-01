// ===== 基礎型別 =====

/** 溫度單位 */
export type TemperatureUnit = 'celsius' | 'fahrenheit';

/** 風速單位 */
export type WindSpeedUnit = 'kmh' | 'ms' | 'mph';

/** 天氣資料來源 */
export type WeatherSource = 'cwa' | 'open-meteo' | 'weatherapi' | 'openweathermap' | 'aggregate';

/** 地理位置 */
export interface Location {
  /** 緯度 */
  latitude: number;
  /** 經度 */
  longitude: number;
  /** 地點名稱（如「台北市信義區」） */
  name: string;
  /** 縣市 */
  city?: string;
  /** 鄉鎮市區 */
  district?: string;
}

// ===== 當前天氣 =====

export interface CurrentWeather {
  /** 資料時間（ISO 8601） */
  timestamp: string;
  /** 氣溫（°C） */
  temperature: number;
  /** 體感溫度（°C） */
  apparentTemperature: number;
  /** 相對濕度（%） */
  humidity: number;
  /** 天氣描述文字 */
  description: string;
  /** 天氣代碼（用於圖示映射） */
  weatherCode: number;
  /** 風速（km/h） */
  windSpeed: number;
  /** 風向（角度 0-360） */
  windDirection: number;
  /** 降水量（mm） */
  precipitation: number;
  /** 降雨機率（%，0-100） */
  precipitationProbability?: number;
  /** 紫外線指數 */
  uvIndex?: number;
  /** 能見度（km） */
  visibility?: number;
  /** 氣壓（hPa） */
  pressure?: number;
}

// ===== 逐時預報 =====

export interface HourlyForecast {
  /** 預報時間（ISO 8601） */
  timestamp: string;
  /** 氣溫（°C） */
  temperature: number;
  /** 體感溫度（°C） */
  apparentTemperature: number;
  /** 天氣代碼 */
  weatherCode: number;
  /** 天氣描述 */
  description: string;
  /** 降雨機率（%） */
  precipitationProbability: number;
  /** 降水量（mm） */
  precipitation: number;
  /** 相對濕度（%） */
  humidity: number;
  /** 風速（km/h） */
  windSpeed: number;
  /** 風向（角度） */
  windDirection: number;
}

// ===== 每日預報 =====

export interface DailyForecast {
  /** 日期（YYYY-MM-DD） */
  date: string;
  /** 最高溫（°C） */
  temperatureMax: number;
  /** 最低溫（°C） */
  temperatureMin: number;
  /** 日間天氣代碼 */
  weatherCode: number;
  /** 天氣描述 */
  description: string;
  /** 降雨機率（%） */
  precipitationProbability: number;
  /** 總降水量（mm） */
  precipitationSum: number;
  /** 日出時間（ISO 8601） */
  sunrise: string;
  /** 日落時間（ISO 8601） */
  sunset: string;
  /** 最大風速（km/h） */
  windSpeedMax: number;
  /** 紫外線指數最大值 */
  uvIndexMax?: number;
}

// ===== 歷史天氣 =====

export interface HistoricalDayWeather {
  /** 日期（YYYY-MM-DD） */
  date: string;
  /** 最高溫（°C） */
  temperatureMax: number;
  /** 最低溫（°C） */
  temperatureMin: number;
  /** 平均溫（°C） */
  temperatureAvg: number;
  /** 天氣代碼 */
  weatherCode: number;
  /** 天氣描述 */
  description: string;
  /** 總降水量（mm） */
  precipitationSum: number;
  /** 平均風速（km/h） */
  windSpeedAvg: number;
  /** 平均濕度（%） */
  humidityAvg: number;
  /** 資料來源 */
  source: WeatherSource;
}

// ===== 聚合介面 =====

export interface WeatherData {
  /** 查詢地點 */
  location: Location;
  /** 資料來源 */
  source: WeatherSource;
  /** 資料取得時間（ISO 8601） */
  fetchedAt: string;
  /** 當前天氣 */
  current: CurrentWeather;
  /** 逐時預報（未來 24-72 小時） */
  hourlyForecast: HourlyForecast[];
  /** 每日預報（未來 7 天） */
  dailyForecast: DailyForecast[];
  /** 歷史天氣（過去 N 天） */
  history: HistoricalDayWeather[];
}

// ===== API Adapter 介面 =====

export interface WeatherApiAdapter {
  /** 來源識別 */
  source: WeatherSource;
  /** 取得當前天氣 + 預報 */
  fetchWeather(location: Location): Promise<Omit<WeatherData, 'history'>>;
  /** 取得歷史天氣（若 API 支援） */
  fetchHistory?(location: Location, days: number): Promise<HistoricalDayWeather[]>;
  /** 健康檢查 */
  healthCheck(): Promise<boolean>;
}

// ===== 資料源選擇與聚合設定 =====

/** 資料源顯示模式 */
export type WeatherDisplayMode = 'single' | 'aggregate';

/** 各來源啟用設定 */
export interface SourceSelectionConfig {
  /** 各資料源是否啟用 */
  enabled: Record<WeatherSource, boolean>;
  /** single 模式下使用的來源（必須為已啟用的來源） */
  activeSource: WeatherSource;
}

/** 氣溫聚合規則 */
export type TemperatureAggregationRule =
  | 'union' // 取所有來源最低溫的最小值 ~ 最高溫的最大值（預設）
  | 'average' // 取平均值
  | 'median' // 取中位數
  | { source: WeatherSource }; // 指定單一來源

/** 降雨 / 其他指標閾值規則 */
export type ThresholdRule =
  | 'any' // 任一來源達標即判定
  | 'all' // 全部來源達標才判定
  | 'half' // 半數以上來源達標
  | { count: number }; // 自定義 N 個來源達標

/** 聚合設定 */
export interface AggregationConfig {
  /** 氣溫聚合規則 */
  temperature: TemperatureAggregationRule;
  /** 降雨判斷閾值規則 */
  precipitation: ThresholdRule;
  /** 濕度閾值規則 */
  humidity: ThresholdRule;
  /** 風速閾值規則 */
  windSpeed: ThresholdRule;
  /** UV 指數閾值規則 */
  uvIndex: ThresholdRule;
  /** 能見度閾值規則 */
  visibility: ThresholdRule;
}

/** 應用程式完整設定 */
export interface AppSettings {
  /** 溫度單位 */
  temperatureUnit: TemperatureUnit;
  /** 風速單位 */
  windSpeedUnit: WindSpeedUnit;
  /** 資料源顯示模式 */
  displayMode: WeatherDisplayMode;
  /** 資料源選擇設定 */
  sourceSelection: SourceSelectionConfig;
  /** 聚合模式設定（僅 displayMode === 'aggregate' 時生效） */
  aggregation: AggregationConfig;
  /** 主題 */
  theme: 'light' | 'dark' | 'system';
}

/** 預設聚合設定 */
export const DEFAULT_AGGREGATION_CONFIG: AggregationConfig = {
  temperature: 'union', // 最廣範圍（最保守）
  precipitation: 'any', // 任一來源預報下雨即判定下雨（最保守）
  humidity: 'any',
  windSpeed: 'any',
  uvIndex: 'any',
  visibility: 'any',
};

// ===== 錯誤型別 =====

/** API 呼叫錯誤 */
export class WeatherApiError extends Error {
  constructor(
    message: string,
    readonly source: WeatherSource,
    readonly statusCode?: number,
    readonly originalError?: Error,
  ) {
    super(message);
    this.name = 'WeatherApiError';
  }
}
