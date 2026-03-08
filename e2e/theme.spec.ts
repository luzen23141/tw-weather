import { test, expect } from '@playwright/test';

const DARK_BACKGROUND = '#0f172a';
const LIGHT_BACKGROUND = '#eef4f8';

type PersistedStore<T> = {
  state: T;
  version: number;
};

function buildSettingsState(theme: 'light' | 'dark' | 'system'): PersistedStore<{
  theme: 'light' | 'dark' | 'system';
  temperatureUnit: 'celsius';
  windSpeedUnit: 'kmh';
  displayMode: 'single';
  locationDisplayFormat: 'township';
  activeSource: 'open-meteo';
  enabledSources: ['open-meteo'];
}> {
  return {
    state: {
      theme,
      temperatureUnit: 'celsius',
      windSpeedUnit: 'kmh',
      displayMode: 'single',
      locationDisplayFormat: 'township',
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
  await page.goto('/settings', { waitUntil: 'networkidle' });
  await page.evaluate((settings) => {
    window.localStorage.setItem('weather-settings', JSON.stringify(settings));
  }, buildSettingsState(theme));
  await page.reload({ waitUntil: 'networkidle' });
  await expect.poll(() => getThemeValue(page)).toBe(theme);
}

async function clickThemeOption(
  page: import('@playwright/test').Page,
  themeLabel: '亮色模式' | '暗色模式',
) {
  const option = page.getByRole('radio', { name: themeLabel, exact: true });
  await expect(option).toBeVisible();
  await option.evaluate((element) => {
    (element as HTMLElement).click();
  });
}

async function getThemeValue(page: import('@playwright/test').Page) {
  return await page.evaluate(() => {
    const value = window.localStorage.getItem('weather-settings');
    if (value === null) {
      return null;
    }

    const parsed = JSON.parse(value) as PersistedStore<{ theme?: 'light' | 'dark' | 'system' }>;
    return parsed.state.theme ?? null;
  });
}

async function getAppliedBackgroundVar(page: import('@playwright/test').Page) {
  return await page.evaluate(() => {
    return getComputedStyle(document.documentElement).getPropertyValue('--color-md-background').trim();
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

    await clickThemeOption(page, '暗色模式');

    await expect.poll(() => getThemeValue(page)).toBe('dark');
    await expect.poll(() => getAppliedBackgroundVar(page)).toBe(DARK_BACKGROUND);
  });

  test('應能切換到淺色主題並套用 light token', async ({ page }) => {
    await setThemeState(page, 'dark');

    await clickThemeOption(page, '亮色模式');

    await expect.poll(() => getThemeValue(page)).toBe('light');
    await expect.poll(() => getAppliedBackgroundVar(page)).toBe(LIGHT_BACKGROUND);
  });

  test('主題設定重新整理後仍會保留並持續套用', async ({ page }) => {
    await setThemeState(page, 'light');

    await clickThemeOption(page, '暗色模式');
    await expect.poll(() => getThemeValue(page)).toBe('dark');

    await page.reload();

    await expect.poll(() => getThemeValue(page)).toBe('dark');
    await expect.poll(() => getAppliedBackgroundVar(page)).toBe(DARK_BACKGROUND);
  });
});
