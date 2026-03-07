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
    await expect(page.getByText('信義區', { exact: true }).first()).toBeVisible();
  });

  test('預報頁在 aggregate 模式應保留 aggregate 設定', async ({ page }) => {
    await seedAggregateMode(page);
    await page.goto('/forecast');

    const settings = await page.evaluate(() => window.localStorage.getItem('weather-settings'));
    expect(settings).toContain('"displayMode":"aggregate"');
    await expect(page.getByText('逐時與每日預報', { exact: true })).toBeVisible();
  });
});
