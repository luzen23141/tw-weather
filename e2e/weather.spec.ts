import { test, expect } from '@playwright/test';

const LOCATION_STORE = {
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

const SETTINGS_STORE = {
  state: {
    theme: 'light',
    temperatureUnit: 'celsius',
    windSpeedUnit: 'kmh',
    displayMode: 'single',
    locationDisplayFormat: 'township',
    activeSource: 'cwa',
    enabledSources: ['cwa'],
  },
  version: 0,
};

function makeProxyResponse(
  provider: string,
  type: 'current' | 'hourly' | 'daily',
  lat: number,
  lon: number,
) {
  const MOCK_CURRENT = {
    temperature: 20,
    apparentTemperature: 21,
    humidity: 82,
    windSpeed: 2,
    windDirection: 180,
    pressure: 1012,
    weatherCode: 4,
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
      weatherCode: 4,
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
      weatherCode: 4,
      description: '陰天',
    },
  ];

  return {
    provider,
    type,
    location: { name: '台北站', lat, lon },
    updatedAt: '2026-03-07T10:00:00+08:00',
    ...(type === 'current' && { current: MOCK_CURRENT }),
    ...(type === 'hourly' && { hourly: MOCK_HOURLY }),
    ...(type === 'daily' && { daily: MOCK_DAILY }),
  };
}

async function mockAllEndpoints(page: import('@playwright/test').Page) {
  for (const endpoint of ['current', 'hourly', 'daily'] as const) {
    await page.route(`**/api/weather/${endpoint}**`, async (route) => {
      const url = new URL(route.request().url());
      const provider = url.searchParams.get('provider') ?? 'cwa';
      const lat = parseFloat(url.searchParams.get('lat') ?? '25.033');
      const lon = parseFloat(url.searchParams.get('lon') ?? '121.5654');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(makeProxyResponse(provider, endpoint, lat, lon)),
      });
    });
  }
}

async function seedState(page: import('@playwright/test').Page) {
  await page.goto('/settings');
  await page.evaluate(
    ({ settings, locations }) => {
      window.localStorage.setItem('weather-settings', JSON.stringify(settings));
      window.localStorage.setItem('weather-locations', JSON.stringify(locations));
    },
    { settings: SETTINGS_STORE, locations: LOCATION_STORE },
  );
  await page.reload();
}

test.describe('天氣頁面', () => {
  test.beforeEach(async ({ page }) => {
    await mockAllEndpoints(page);
    await seedState(page);
  });

  test('應顯示當前天氣資料', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/信義區/).first()).toBeVisible();
    // 驗證溫度顯示（mock 回傳 20 度）
    await expect(page.getByText(/20/).first()).toBeVisible();
  });

  test('應顯示天氣描述', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('陰天').first()).toBeVisible();
  });

  test('應顯示風速資訊', async ({ page }) => {
    await page.goto('/');
    // mock windSpeed = 2
    await expect(page.getByText(/km\/h/).first()).toBeVisible();
  });
});
