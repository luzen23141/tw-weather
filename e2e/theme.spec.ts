import { test, expect } from '@playwright/test';

const DARK_BACKGROUND = '#0f172a';
const LIGHT_BACKGROUND = '#f0f4f8';

type PersistedStore<T> = {
  state: T;
  version: number;
};

function buildSettingsState(theme: 'light' | 'dark' | 'system'): PersistedStore<{
  theme: 'light' | 'dark' | 'system';
  temperatureUnit: 'celsius';
  windSpeedUnit: 'kmh';
  displayMode: 'single';
  activeSource: 'open-meteo';
  enabledSources: ['open-meteo'];
}> {
  return {
    state: {
      theme,
      temperatureUnit: 'celsius',
      windSpeedUnit: 'kmh',
      displayMode: 'single',
      activeSource: 'open-meteo',
      enabledSources: ['open-meteo'],
    },
    version: 0,
  };
}

async function setThemeState(
  page: import('@playwright/test').Page,
  theme: 'light' | 'dark' | 'system',
) {
  await page.goto('/settings');
  await page.evaluate((settings) => {
    window.localStorage.setItem('weather-settings', JSON.stringify(settings));
  }, buildSettingsState(theme));
  await page.reload();
}

async function getAppliedBackgroundVar(page: import('@playwright/test').Page) {
  return await page.evaluate(() => {
    const element = Array.from(document.querySelectorAll('div')).find((node) => {
      return window.getComputedStyle(node).getPropertyValue('--color-md-background').trim();
    });

    if (!element) {
      return null;
    }

    return window.getComputedStyle(element).getPropertyValue('--color-md-background').trim();
  });
}

test.describe('主題切換', () => {
  test('應能進入設定並找到主題選項', async ({ page }) => {
    await page.goto('/');
    await page.locator('a[href="/settings"]').click();
    await expect(page.getByText('主題外觀')).toBeVisible();
  });

  test('應能切換到深色主題並套用 dark token', async ({ page }) => {
    await setThemeState(page, 'light');

    await page.getByText('暗色模式', { exact: true }).click();

    const settings = await page.evaluate(() => window.localStorage.getItem('weather-settings'));
    expect(settings).toContain('"theme":"dark"');
    await expect.poll(() => getAppliedBackgroundVar(page)).toBe(DARK_BACKGROUND);
  });

  test('應能切換到淺色主題並套用 light token', async ({ page }) => {
    await setThemeState(page, 'dark');

    await page.getByText('亮色模式', { exact: true }).click();

    const settings = await page.evaluate(() => window.localStorage.getItem('weather-settings'));
    expect(settings).toContain('"theme":"light"');
    await expect.poll(() => getAppliedBackgroundVar(page)).toBe(LIGHT_BACKGROUND);
  });

  test('主題設定重新整理後仍會保留並持續套用', async ({ page }) => {
    await setThemeState(page, 'light');

    await page.getByText('暗色模式', { exact: true }).click();
    await expect
      .poll(() => page.evaluate(() => window.localStorage.getItem('weather-settings')))
      .toContain('"theme":"dark"');

    await page.reload();

    const settings = await page.evaluate(() => window.localStorage.getItem('weather-settings'));
    expect(settings).toContain('"theme":"dark"');
    await expect.poll(() => getAppliedBackgroundVar(page)).toBe(DARK_BACKGROUND);
  });
});
