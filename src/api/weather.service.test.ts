/*
  聚合模式的來源歸屬與熔斷行為。

  這裡刻意不驗證聚合出來的「數值」（那是 AggregationEngine 的責任，已有自己的
  測試），只驗證 WeatherService 對「哪個來源成功、哪個失敗」的歸屬是否正確 ——
  那正是先前出錯的地方。
*/

const makeAdapterMock = () => ({
  fetchWeather: jest.fn(),
  fetchHistory: jest.fn(async () => []),
});

const cwaMock = makeAdapterMock();
const openMeteoMock = makeAdapterMock();
const weatherApiMock = makeAdapterMock();
const openWeatherMapMock = makeAdapterMock();

jest.mock('@/api/adapters/cwa.adapter', () => ({ __esModule: true, default: cwaMock }));
jest.mock('@/api/adapters/open-meteo.adapter', () => ({
  __esModule: true,
  default: openMeteoMock,
}));
jest.mock('@/api/adapters/weatherapi.adapter', () => ({
  __esModule: true,
  default: weatherApiMock,
}));
jest.mock('@/api/adapters/openweathermap.adapter', () => ({
  __esModule: true,
  default: openWeatherMapMock,
}));

import { weatherService } from '@/api/weather.service';
import {
  DEFAULT_AGGREGATION_CONFIG,
  type AggregationConfig,
  type Location,
  type WeatherData,
  type WeatherSource,
} from '@/api/types';

const LOCATION: Location = {
  name: '板橋區',
  country: '台灣',
  city: '新北市',
  latitude: 25.0142,
  longitude: 121.4592,
};

const CONFIG: AggregationConfig = { ...DEFAULT_AGGREGATION_CONFIG, temperature: 'average' };

function makeWeather(source: WeatherSource, temperature: number): WeatherData {
  return {
    location: LOCATION,
    source,
    fetchedAt: '2026-07-26T00:00:00+08:00',
    current: {
      timestamp: '2026-07-26T00:00:00+08:00',
      temperature,
      apparentTemperature: temperature,
      humidity: 70,
      description: '陰天',
      weatherCode: 3,
      windSpeed: 5,
      windDirection: 90,
      precipitation: 0,
    },
    hourlyForecast: [],
    dailyForecast: [],
    history: [],
  };
}

/**
 * 讓熔斷器回到乾淨狀態。
 *
 * `weatherService` 是 module-level 單例、failureTracker 是 private，測試之間
 * 會互相污染。成功一次會清掉該來源的失敗計數，所以用一輪全成功來重置。
 */
async function resetCircuit() {
  cwaMock.fetchWeather.mockResolvedValue(makeWeather('cwa', 30));
  openMeteoMock.fetchWeather.mockResolvedValue(makeWeather('open-meteo', 30));
  await weatherService.fetchAggregated(LOCATION, ['cwa', 'open-meteo'], CONFIG);
  jest.clearAllMocks();
}

describe('WeatherService.fetchAggregated', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await resetCircuit();
  });

  it('部分來源失敗時應以剩餘來源回傳結果', async () => {
    cwaMock.fetchWeather.mockRejectedValue(new Error('CWA 掛了'));
    openMeteoMock.fetchWeather.mockResolvedValue(makeWeather('open-meteo', 28));

    const result = await weatherService.fetchAggregated(LOCATION, ['cwa', 'open-meteo'], CONFIG);

    // 只剩一個成功來源時直接回傳它，不進聚合
    expect(result.current.temperature).toBe(28);
  });

  it('全部來源失敗時應拋錯', async () => {
    cwaMock.fetchWeather.mockRejectedValue(new Error('CWA 掛了'));
    openMeteoMock.fetchWeather.mockRejectedValue(new Error('Open-Meteo 掛了'));

    await expect(
      weatherService.fetchAggregated(LOCATION, ['cwa', 'open-meteo'], CONFIG),
    ).rejects.toThrow(/所有資料源查詢失敗/);
  });

  /*
    迴歸測試：先前用 `results.filter(...).map((r, index) => sourcesToFetch[index])`
    取得來源，但 filter 之後的 index 是過濾後陣列的索引，不再對應原始來源。

    實際後果就是這個情境 —— CWA 一直失敗、Open-Meteo 一直成功時，Open-Meteo 的
    成功被記到 CWA 頭上並清掉它的失敗計數，CWA 因此永遠達不到熔斷門檻，
    app 會無止盡地打一個已知壞掉的上游。
  */
  it('持續失敗的來源應被熔斷，不再被呼叫', async () => {
    cwaMock.fetchWeather.mockRejectedValue(new Error('CWA 掛了'));
    openMeteoMock.fetchWeather.mockResolvedValue(makeWeather('open-meteo', 28));

    // 門檻為連續 3 次失敗
    for (let i = 0; i < 3; i += 1) {
      await weatherService.fetchAggregated(LOCATION, ['cwa', 'open-meteo'], CONFIG);
    }
    expect(cwaMock.fetchWeather).toHaveBeenCalledTimes(3);

    cwaMock.fetchWeather.mockClear();
    await weatherService.fetchAggregated(LOCATION, ['cwa', 'open-meteo'], CONFIG);

    expect(cwaMock.fetchWeather).not.toHaveBeenCalled();
    expect(openMeteoMock.fetchWeather).toHaveBeenCalled();
  });

  it('成功的來源不應因其他來源失敗而被熔斷', async () => {
    cwaMock.fetchWeather.mockRejectedValue(new Error('CWA 掛了'));
    openMeteoMock.fetchWeather.mockResolvedValue(makeWeather('open-meteo', 28));

    for (let i = 0; i < 4; i += 1) {
      await weatherService.fetchAggregated(LOCATION, ['cwa', 'open-meteo'], CONFIG);
    }

    // Open-Meteo 全程成功，必須每一輪都有被呼叫到
    expect(openMeteoMock.fetchWeather).toHaveBeenCalledTimes(4);
  });

  /*
    所有來源都熔斷時不能直接放棄 —— 那會讓 app 在熔斷視窗內完全取不到資料。
    退回第一個來源當作探路，成功就順勢解除熔斷。
  */
  it('全部來源皆熔斷時應退回第一個來源重試', async () => {
    cwaMock.fetchWeather.mockRejectedValue(new Error('CWA 掛了'));

    for (let i = 0; i < 3; i += 1) {
      await weatherService.fetchAggregated(LOCATION, ['cwa'], CONFIG).catch(() => undefined);
    }

    cwaMock.fetchWeather.mockClear();
    cwaMock.fetchWeather.mockResolvedValue(makeWeather('cwa', 31));

    const result = await weatherService.fetchAggregated(LOCATION, ['cwa'], CONFIG);

    expect(cwaMock.fetchWeather).toHaveBeenCalled();
    expect(result.current.temperature).toBe(31);
  });

  it('兩個來源都成功時應進入聚合', async () => {
    cwaMock.fetchWeather.mockResolvedValue(makeWeather('cwa', 30));
    openMeteoMock.fetchWeather.mockResolvedValue(makeWeather('open-meteo', 28));

    const result = await weatherService.fetchAggregated(LOCATION, ['cwa', 'open-meteo'], CONFIG);

    expect(result.source).toBe('aggregate');
    // average 模式：兩來源的中間值
    expect(result.current.temperature).toBe(29);
  });
});

describe('WeatherService.fetchWeather', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('應回傳指定來源的資料', async () => {
    openMeteoMock.fetchWeather.mockResolvedValue(makeWeather('open-meteo', 26));

    const result = await weatherService.fetchWeather(LOCATION, 'open-meteo');

    expect(result.current.temperature).toBe(26);
  });

  it('未知來源應拋出可辨識的錯誤', async () => {
    await expect(
      weatherService.fetchWeather(LOCATION, 'not-a-source' as WeatherSource),
    ).rejects.toThrow(/不支援的資料源/);
  });

  it('adapter 拋錯時應包裝為帶來源資訊的錯誤', async () => {
    cwaMock.fetchWeather.mockRejectedValue(new Error('連線逾時'));

    await expect(weatherService.fetchWeather(LOCATION, 'cwa')).rejects.toThrow(/cwa/);
  });
});
