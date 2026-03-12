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
    activeSource: 'open-meteo',
    enabledSources: ['open-meteo'],
  },
  version: 0,
};

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

test.describe('歷史天氣', () => {
  test.beforeEach(async ({ page }) => {
    // Mock history endpoint
    await page.route('**/api/weather/history**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          provider: 'open-meteo',
          type: 'history',
          location: { name: '台北站', lat: 25.033, lon: 121.5654 },
          updatedAt: '2026-03-07T10:00:00+08:00',
          history: [
            {
              date: '2026-03-06T00:00:00+08:00',
              tempMax: 24,
              tempMin: 18,
              humidity: 75,
              windSpeed: 3,
              precipitation: 0,
              precipProb: 30,
              weatherCode: 4,
              description: '陰天',
            },
          ],
        }),
      });
    });

    // Mock current/hourly/daily（頁面導航可能觸發）
    for (const endpoint of ['current', 'hourly', 'daily'] as const) {
      await page.route(`**/api/weather/${endpoint}**`, async (route) => {
        const url = new URL(route.request().url());
        const provider = url.searchParams.get('provider') ?? 'open-meteo';

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

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            provider,
            type: endpoint,
            location: { name: '台北站', lat: 25.033, lon: 121.5654 },
            updatedAt: '2026-03-07T10:00:00+08:00',
            ...(endpoint === 'current' && { current: MOCK_CURRENT }),
            ...(endpoint === 'hourly' && { hourly: MOCK_HOURLY }),
            ...(endpoint === 'daily' && { daily: MOCK_DAILY }),
          }),
        });
      });
    }

    await seedState(page);
  });

  test('應能進入歷史天氣頁面', async ({ page }) => {
    await page.goto('/history');
    await expect(page.getByText(/歷史天氣/).first()).toBeVisible();
  });

  test('歷史天氣應顯示溫度資料', async ({ page }) => {
    await page.goto('/history');
    // 等待頁面載入
    await expect(page.getByText(/°/).first()).toBeVisible({ timeout: 15000 });
  });
});
