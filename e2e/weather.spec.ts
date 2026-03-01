import { test, expect } from '@playwright/test';

test.describe.skip('天氣頁面', () => {
  test('應顯示當前天氣資料', async ({ page }) => {
    await page.goto('/');

    // 驗證頁面標題
    await expect(page.locator('text=天氣')).toBeVisible();

    // 驗證顯示城市名稱
    const cityName = page.locator('text=台北');
    await expect(cityName).toBeVisible();

    // 驗證溫度顯示
    const temperature = page.locator('text=/\\d+°C/');
    await expect(temperature).toBeVisible();

    // 驗證天氣描述
    const description = page.locator('text=/晴|雨|雲/');
    await expect(description).toBeVisible();

    // 驗證濕度顯示
    const humidity = page.locator('text=/濕度|水氣/');
    await expect(humidity).toBeVisible();
  });

  test('應正確顯示天氣圖標', async ({ page }) => {
    await page.goto('/');

    // 驗證天氣圖標存在
    const weatherIcon = page.locator('img[alt*="天氣"]');
    await expect(weatherIcon).toBeVisible();
  });

  test('應顯示風速和風向資訊', async ({ page }) => {
    await page.goto('/');

    // 驗證風速資訊
    const windSpeed = page.locator('text=/風速|km\/h/');
    await expect(windSpeed).toBeVisible();
  });
});
