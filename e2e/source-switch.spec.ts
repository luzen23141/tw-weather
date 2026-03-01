import { test, expect } from '@playwright/test';

test.describe.skip('資料源切換', () => {
  test('應能在設定頁切換資料源', async ({ page }) => {
    await page.goto('/');

    // 進入設定頁
    const settingsTab = page.locator('text=設定');
    await settingsTab.click();

    await page.waitForLoadState('networkidle');

    // 驗證資料源區塊
    const dataSourceSection = page.locator('text=資料源');
    await expect(dataSourceSection).toBeVisible();
  });

  test('應能從 CWA 切換到 Open-Meteo', async ({ page }) => {
    await page.goto('/settings');

    // 向下滾動到資料源選項
    await page.locator('text=資料源').scrollIntoViewIfNeeded();

    // 點擊 Open-Meteo 選項
    const openMeteoOption = page.locator('text=Open-Meteo');
    await openMeteoOption.click();

    await page.waitForLoadState('networkidle');

    // 驗證選擇已更新
    const selected = page.locator('text=Open-Meteo');
    await expect(selected).toBeVisible();
  });

  test('應能從 Open-Meteo 切換到 WeatherAPI', async ({ page }) => {
    await page.goto('/settings');

    // 向下滾動到資料源選項
    await page.locator('text=資料源').scrollIntoViewIfNeeded();

    // 先選擇 Open-Meteo
    await page.locator('text=Open-Meteo').click();
    await page.waitForLoadState('networkidle');

    // 再選擇 WeatherAPI
    const weatherAPIOption = page.locator('text=WeatherAPI');
    await weatherAPIOption.click();

    await page.waitForLoadState('networkidle');

    // 驗證選擇已更新
    const selected = page.locator('text=WeatherAPI');
    await expect(selected).toBeVisible();
  });

  test('切換資料源後應重新載入天氣資料', async ({ page }) => {
    await page.goto('/');

    // 等待初始天氣資料載入
    await page.locator('text=/\\d+°C/').first().waitFor();

    // 進入設定頁
    await page.locator('text=設定').click();

    // 切換資料源
    await page.locator('text=資料源').scrollIntoViewIfNeeded();
    await page.locator('text=Open-Meteo').click();

    await page.waitForLoadState('networkidle');

    // 返回主頁
    await page.locator('text=天氣').click();

    await page.waitForLoadState('networkidle');

    // 驗證天氣資料仍然存在
    const temp = await page.locator('text=/\\d+°C/').first().textContent();
    await expect(temp).toBeTruthy();
  });
});
