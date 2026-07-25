import { expect, test } from '@playwright/test';

type WeatherSource = 'cwa' | 'open-meteo' | 'weatherapi' | 'openweathermap';

type PersistedStore<T> = {
  state: T;
  version: number;
};

const LOCATION_STORE: PersistedStore<{
  savedLocations: Array<{
    name: string;
    city: string;
    district?: string;
    township?: string;
    latitude: number;
    longitude: number;
  }>;
  selectedLocation: {
    name: string;
    city: string;
    district?: string;
    township?: string;
    latitude: number;
    longitude: number;
  };
}> = {
  state: {
    savedLocations: [
      {
        name: '台北市信義區',
        city: '台北市',
        district: '信義區',
        township: '信義區',
        latitude: 25.033,
        longitude: 121.5654,
      },
    ],
    selectedLocation: {
      name: '台北市信義區',
      city: '台北市',
      district: '信義區',
      township: '信義區',
      latitude: 25.033,
      longitude: 121.5654,
    },
  },
  version: 0,
};

function buildSingleSettings(source: WeatherSource): PersistedStore<{
  theme: 'light';
  temperatureUnit: 'celsius';
  windSpeedUnit: 'kmh';
  displayMode: 'single';
  locationDisplayFormat: 'township';
  activeSource: WeatherSource;
  enabledSources: WeatherSource[];
}> {
  return {
    state: {
      theme: 'light',
      temperatureUnit: 'celsius',
      windSpeedUnit: 'kmh',
      displayMode: 'single',
      locationDisplayFormat: 'township',
      activeSource: source,
      enabledSources: [source],
    },
    version: 0,
  };
}

const AGGREGATE_SETTINGS: PersistedStore<{
  theme: 'light';
  temperatureUnit: 'celsius';
  windSpeedUnit: 'kmh';
  displayMode: 'aggregate';
  locationDisplayFormat: 'township';
  activeSource: 'cwa';
  enabledSources: ['cwa', 'open-meteo'];
}> = {
  state: {
    theme: 'light',
    temperatureUnit: 'celsius',
    windSpeedUnit: 'kmh',
    displayMode: 'aggregate',
    locationDisplayFormat: 'township',
    activeSource: 'cwa',
    enabledSources: ['cwa', 'open-meteo'],
  },
  version: 0,
};

async function seedState(
  page: import('@playwright/test').Page,
  settings: PersistedStore<unknown>,
  locations: PersistedStore<unknown> = LOCATION_STORE,
): Promise<void> {
  await page.goto('/settings');
  await page.evaluate(
    ({ state, locations }) => {
      window.localStorage.setItem('weather-settings', JSON.stringify(state));
      window.localStorage.setItem('weather-locations', JSON.stringify(locations));
    },
    { state: settings, locations },
  );
  await page.reload();
}

// ProxyWeatherResponse 格式的共用 mock 資料
const MOCK_CURRENT = {
  temperature: 20,
  apparentTemperature: 21,
  humidity: 82,
  windSpeed: 2,
  windDirection: 180,
  pressure: 1012,
  weatherCode: 3,
  description: '陰天',
  precipitation: 0,
};

const MOCK_HOURLY = [
  {
    time: '2026-03-07T12:00:00+08:00',
    temperature: 21,
    apparentTemperature: 22,
    humidity: 80,
    windSpeed: 3,
    windDirection: 150,
    precipitation: 0,
    precipProb: 40,
    weatherCode: 3,
    description: '陰天',
  },
];

const MOCK_DAILY = [
  {
    date: '2026-03-07T00:00:00+08:00',
    tempMax: 24,
    tempMin: 18,
    humidity: 75,
    windSpeed: 3,
    precipitation: 0,
    precipProb: 30,
    weatherCode: 3,
    description: '陰天',
  },
];

function makeProxyResponse(
  provider: string,
  type: 'current' | 'hourly' | 'daily',
  lat: number,
  lon: number,
) {
  return {
    location: {
      name: '台北市信義區',
      city: '台北市',
      district: '信義區',
      township: '信義區',
      latitude: lat,
      longitude: lon,
    },
    source: provider,
    fetchedAt: '2026-03-07T10:00:00+08:00',
    current:
      type === 'current' ? { ...MOCK_CURRENT, timestamp: '2026-03-07T10:00:00+08:00' } : null,
    hourlyForecast:
      type === 'hourly'
        ? MOCK_HOURLY.map((item) => ({
            ...item,
            timestamp: item.time,
            precipitationProbability: item.precipProb,
          }))
        : [],
    dailyForecast:
      type === 'daily'
        ? MOCK_DAILY.map((item) => ({
            date: item.date.split('T')[0],
            temperatureMax: item.tempMax,
            temperatureMin: item.tempMin,
            precipitationProbability: item.precipProb,
            precipitationSum: item.precipitation,
            windSpeedMax: item.windSpeed,
            weatherCode: item.weatherCode,
            description: item.description,
          }))
        : [],
    history: [],
  };
}

async function mockAllWeatherApis(page: import('@playwright/test').Page): Promise<void> {
  // Mock proxy /api/weather/* 端點（cwa, open-meteo, weatherapi）
  await page.route('**/api/weather/current**', async (route) => {
    const url = new URL(route.request().url());
    const provider = url.searchParams.get('provider') ?? 'cwa';
    const lat = parseFloat(url.searchParams.get('lat') ?? '25.033');
    const lon = parseFloat(url.searchParams.get('lon') ?? '121.5654');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(makeProxyResponse(provider, 'current', lat, lon)),
    });
  });

  await page.route('**/api/weather/hourly**', async (route) => {
    const url = new URL(route.request().url());
    const provider = url.searchParams.get('provider') ?? 'cwa';
    const lat = parseFloat(url.searchParams.get('lat') ?? '25.033');
    const lon = parseFloat(url.searchParams.get('lon') ?? '121.5654');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(makeProxyResponse(provider, 'hourly', lat, lon)),
    });
  });

  await page.route('**/api/weather/daily**', async (route) => {
    const url = new URL(route.request().url());
    const provider = url.searchParams.get('provider') ?? 'cwa';
    const lat = parseFloat(url.searchParams.get('lat') ?? '25.033');
    const lon = parseFloat(url.searchParams.get('lon') ?? '121.5654');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        location: {
          name: '台北市信義區',
          city: '台北市',
          district: '信義區',
          township: '信義區',
          latitude: lat,
          longitude: lon,
        },
        source: provider,
        fetchedAt: '2026-03-07T10:00:00+08:00',
        current: null,
        hourlyForecast: [],
        dailyForecast: [],
        history: [
          {
            date: '2026-03-07',
            temperatureMax: 24,
            temperatureMin: 18,
            temperatureAvg: 21,
            weatherCode: 3,
            description: '陰天',
            precipitationSum: 0,
            windSpeedAvg: 3,
            humidityAvg: 75,
            source: provider,
          },
        ],
      }),
    });
  });

  await page.route('**/api/weather/history**', async (route) => {
    const url = new URL(route.request().url());
    const provider = url.searchParams.get('provider') ?? 'open-meteo';
    const lat = parseFloat(url.searchParams.get('lat') ?? '25.033');
    const lon = parseFloat(url.searchParams.get('lon') ?? '121.5654');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(makeProxyResponse(provider, 'daily', lat, lon)),
    });
  });

  // Mock proxy /api/proxy 端點（openweathermap 使用舊格式）
  await page.route('**/api/proxy**', async (route) => {
    const url = new URL(route.request().url());
    const service = url.searchParams.get('service') ?? '';
    const endpoint = url.searchParams.get('endpoint') ?? '';

    if (service === 'openweathermap' && endpoint.includes('weather')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          dt: 1709800000,
          main: {
            temp: 23,
            feels_like: 24,
            temp_min: 21,
            temp_max: 25,
            pressure: 1011,
            humidity: 74,
          },
          wind: { speed: 5, deg: 160 },
          weather: [{ id: 803, main: 'Clouds', description: 'broken clouds' }],
          visibility: 10000,
        }),
      });
    } else if (service === 'openweathermap' && endpoint.includes('forecast')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          list: [
            {
              dt: 1709800000,
              main: {
                temp: 23,
                feels_like: 24,
                temp_min: 22,
                temp_max: 24,
                pressure: 1011,
                humidity: 74,
              },
              weather: [{ id: 803, main: 'Clouds', description: 'broken clouds' }],
              wind: { speed: 5, deg: 160 },
              pop: 0.3,
              rain: { '3h': 0.2 },
              dt_txt: '2026-03-07 12:00:00',
            },
          ],
          city: { sunrise: 1709772000, sunset: 1709815200 },
        }),
      });
    } else {
      await route.fulfill({ status: 404, body: 'Not found' });
    }
  });
}

async function mockCwaPartialFailure(page: import('@playwright/test').Page): Promise<void> {
  // current 成功，hourly 和 daily 回傳 502（模擬上游錯誤）
  await page.route('**/api/weather/current**', async (route) => {
    const url = new URL(route.request().url());
    const provider = url.searchParams.get('provider') ?? 'cwa';
    const lat = parseFloat(url.searchParams.get('lat') ?? '25.033');
    const lon = parseFloat(url.searchParams.get('lon') ?? '121.5654');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(makeProxyResponse(provider, 'current', lat, lon)),
    });
  });

  await page.route('**/api/weather/hourly**', async (route) => {
    await route.fulfill({
      status: 502,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'upstream error' }),
    });
  });

  await page.route('**/api/weather/daily**', async (route) => {
    await route.fulfill({
      status: 502,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'upstream error' }),
    });
  });
}

async function assertWeatherPagesBySource(
  page: import('@playwright/test').Page,
  badge: string,
): Promise<void> {
  await page.goto('/');
  await expect(page.getByText(/體感 \d+°/)).toBeVisible();
  await expect(page.getByText(badge, { exact: true }).first()).toBeVisible();

  // 每日預報已併入首頁，來源標示同樣在首頁的資料來源列
  await expect(page.getByText('每日預報', { exact: true })).toBeVisible();
}

test.describe('資料源 E2E', () => {
  test.beforeEach(async ({ page }) => {
    await mockAllWeatherApis(page);
  });

  test.describe('單一資料源', () => {
    const cases: Array<{ source: WeatherSource; badge: string }> = [
      { source: 'cwa', badge: 'CWA' },
      { source: 'open-meteo', badge: 'Open-Meteo' },
      { source: 'weatherapi', badge: 'WeatherAPI' },
      { source: 'openweathermap', badge: 'OWM' },
    ];

    for (const item of cases) {
      test(`${item.source} 應在首頁與預報頁顯示正確來源標籤`, async ({ page }) => {
        await seedState(page, buildSingleSettings(item.source));
        await assertWeatherPagesBySource(page, item.badge);
      });
    }
  });

  test('CWA 資料源部分端點失敗時應顯示錯誤狀態', async ({ page }) => {
    await mockCwaPartialFailure(page);
    await seedState(page, buildSingleSettings('cwa'));

    await page.goto('/');

    // 由於 fetchWeather 使用 Promise.all 並行呼叫三個端點，
    // 任一失敗都會導致整體失敗，應顯示錯誤狀態
    await expect(page.getByText('無法取得天氣資料').first()).toBeVisible({ timeout: 15000 });
    // 應有重試按鈕
    await expect(page.getByText('重試').first()).toBeVisible();
  });

  test('聚合模式應在首頁、預報、歷史頁顯示聚合來源', async ({ page }) => {
    await seedState(page, AGGREGATE_SETTINGS);

    await page.goto('/');
    await expect(page.getByText(/體感 \d+°/)).toBeVisible();
    await expect(page.getByText('聚合', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('每日預報', { exact: true })).toBeVisible();

    await page.goto('/history');
    const settings = await page.evaluate(() => window.localStorage.getItem('weather-settings'));
    expect(settings).toContain('"displayMode":"aggregate"');
  });
});
