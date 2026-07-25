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
    /*
      Mock history endpoint — 回傳「今天」的日期，讓 selectedDate 預設值能匹配。

      必須用本地日期而非 `toISOString()`：後者是 UTC，台灣（UTC+8）在
      00:00~08:00 之間會得到前一天，而 app 是以本地日期判斷「今天」，
      兩邊對不上就會在清晨跑 CI 時無預警變紅。
    */
    const now = new Date();
    const todayISO = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate(),
    ).padStart(2, '0')}`;
    await page.route('**/api/weather/history**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          location: { name: '台北站', latitude: 25.033, longitude: 121.5654 },
          source: 'open-meteo',
          fetchedAt: new Date().toISOString(),
          current: null,
          hourlyForecast: [],
          dailyForecast: [],
          history: [
            {
              date: todayISO,
              temperatureMax: 24,
              temperatureMin: 18,
              temperatureAvg: 21,
              weatherCode: 3,
              description: '陰天',
              precipitationSum: 0,
              windSpeedAvg: 3,
              humidityAvg: 75,
              source: 'open-meteo',
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
          weatherCode: 3,
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

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            location: { name: '台北站', latitude: 25.033, longitude: 121.5654 },
            source: provider,
            fetchedAt: '2026-03-07T10:00:00+08:00',
            current:
              endpoint === 'current'
                ? { ...MOCK_CURRENT, timestamp: '2026-03-07T10:00:00+08:00' }
                : null,
            hourlyForecast:
              endpoint === 'hourly'
                ? MOCK_HOURLY.map((item) => ({
                    ...item,
                    timestamp: item.time,
                    precipitationProbability: item.precipProb,
                  }))
                : [],
            dailyForecast:
              endpoint === 'daily'
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
          }),
        });
      });
    }

    await seedState(page);
  });

  test('應能進入歷史天氣頁面', async ({ page }) => {
    await page.goto('/history');
    await expect(page).toHaveURL(/\/history$/);
  });

  test('歷史天氣應顯示溫度資料', async ({ page }) => {
    await page.goto('/history');
    await expect(page.locator('body')).toContainText(/歷史摘要|無歷史資料|重試/, {
      timeout: 15000,
    });
  });
});
