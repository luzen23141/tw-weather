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
    provider,
    type,
    location: { name: '台北站', lat: 25.033, lon: 121.5654 },
    updatedAt: '2026-03-07T10:00:00+08:00',
  };
  if (type === 'current') {
    return {
      ...base,
      current: {
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
      hourly: [
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
      ],
    };
  }
  // daily 和 history 都回傳 daily 格式
  return {
    ...base,
    type: type === 'history' ? 'daily' : type,
    daily: [
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
    await expect(page.getByText(/信義區/).first()).toBeVisible();
  });

  test('預報頁在 aggregate 模式應保留 aggregate 設定', async ({ page }) => {
    await seedAggregateMode(page);
    await page.goto('/forecast');

    const settings = await page.evaluate(() => window.localStorage.getItem('weather-settings'));
    expect(settings).toContain('"displayMode":"aggregate"');
    await expect(page.getByText('逐時與每日預報', { exact: true })).toBeVisible();
  });
});
