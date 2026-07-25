import { test, expect } from '@playwright/test';

const AGGREGATE_SETTINGS = {
  state: {
    theme: 'light',
    temperatureUnit: 'celsius',
    windSpeedUnit: 'kmh',
    locationDisplayFormat: 'township',
    displayMode: 'aggregate',
    activeSource: 'cwa',
    enabledSources: ['open-meteo', 'cwa'],
  },
  version: 0,
};

const SELECTED_LOCATION = {
  state: {
    savedLocations: [
      {
        name: '台北市信義區',
        city: '台北市',
        district: '信義區',
        latitude: 25.033,
        longitude: 121.5654,
      },
    ],
    selectedLocation: {
      name: '台北市信義區',
      city: '台北市',
      district: '信義區',
      latitude: 25.033,
      longitude: 121.5654,
    },
  },
  version: 0,
};

function makeMockResponse(provider: string, type: 'current' | 'hourly' | 'daily' | 'history') {
  const base = {
    location: { name: '台北站', latitude: 25.033, longitude: 121.5654 },
    source: provider,
    fetchedAt: '2026-03-07T10:00:00+08:00',
    current: null,
    hourlyForecast: [],
    dailyForecast: [],
    history: [],
  };
  if (type === 'current') {
    return {
      ...base,
      current: {
        timestamp: '2026-03-07T10:00:00+08:00',
        temperature: 20,
        apparentTemperature: 21,
        humidity: 82,
        windSpeed: 2,
        windDirection: 180,
        pressure: 1012,
        weatherCode: 3,
        description: '陰天',
        precipitation: 0,
      },
    };
  }
  if (type === 'hourly') {
    return {
      ...base,
      hourlyForecast: [
        {
          timestamp: '2026-03-07T12:00:00+08:00',
          temperature: 21,
          apparentTemperature: 22,
          humidity: 80,
          windSpeed: 3,
          windDirection: 150,
          precipitation: 0,
          precipitationProbability: 40,
          weatherCode: 3,
          description: '陰天',
        },
      ],
    };
  }
  if (type === 'daily') {
    return {
      ...base,
      dailyForecast: [
        {
          date: '2026-03-07',
          temperatureMax: 24,
          temperatureMin: 18,
          precipitationProbability: 30,
          precipitationSum: 0,
          windSpeedMax: 3,
          weatherCode: 3,
          description: '陰天',
        },
      ],
    };
  }
  return {
    ...base,
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
  };
}

async function mockWeatherApis(page: import('@playwright/test').Page) {
  for (const endpoint of ['current', 'hourly', 'daily', 'history'] as const) {
    await page.route(`**/api/weather/${endpoint}**`, async (route) => {
      const url = new URL(route.request().url());
      const provider = url.searchParams.get('provider') ?? 'cwa';
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(makeMockResponse(provider, endpoint)),
      });
    });
  }
}

async function seedAggregateMode(page: import('@playwright/test').Page) {
  await page.goto('/settings');
  await page.evaluate(
    ({ settings, locations }) => {
      window.localStorage.setItem('weather-settings', JSON.stringify(settings));
      window.localStorage.setItem('weather-locations', JSON.stringify(locations));
    },
    { settings: AGGREGATE_SETTINGS, locations: SELECTED_LOCATION },
  );
  await page.reload();
}

test.describe('聚合模式', () => {
  test.beforeEach(async ({ page }) => {
    await mockWeatherApis(page);
  });

  test('設定頁應顯示聚合模式已啟用', async ({ page }) => {
    await seedAggregateMode(page);

    const aggregateOption = page.getByText('聚合模式', { exact: true });
    await expect(aggregateOption).toBeVisible();

    const settings = await page.evaluate(() => window.localStorage.getItem('weather-settings'));
    expect(settings).toContain('"displayMode":"aggregate"');
  });

  test('首頁在 aggregate 模式應保留 aggregate 設定', async ({ page }) => {
    await seedAggregateMode(page);
    await page.goto('/');

    const settings = await page.evaluate(() => window.localStorage.getItem('weather-settings'));
    expect(settings).toContain('"displayMode":"aggregate"');
    await expect(page.getByText(/體感 \d+°/)).toBeVisible();
  });

  // 原本的預報分頁已移除 —— 每日預報併入首頁，且擴充為昨日 + 今日 + 未來
  test('首頁每日預報在 aggregate 模式應保留 aggregate 設定', async ({ page }) => {
    await seedAggregateMode(page);
    await page.goto('/');

    const settings = await page.evaluate(() => window.localStorage.getItem('weather-settings'));
    expect(settings).toContain('"displayMode":"aggregate"');
    await expect(page.getByText('每日預報', { exact: true })).toBeVisible();
  });
});
