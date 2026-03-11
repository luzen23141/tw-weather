import { test, expect } from '@playwright/test';

const FIXED_HISTORY_DATE = '2026-03-06';

test.describe.skip('歷史天氣', () => {
  test('應能進入歷史天氣頁面', async ({ page }) => {
    await page.goto('/');

    // 點擊歷史標籤
    const historyTab = page.locator('text=歷史');
    await historyTab.click();

    await page.waitForLoadState('networkidle');

    // 驗證頁面標題
    await expect(page.locator('text=歷史')).toBeVisible();
  });

  test('歷史天氣應顯示日期和天氣資料', async ({ page }) => {
    await page.goto('/');

    // 點擊歷史標籤
    await page.locator('text=歷史').click();

    await page.waitForLoadState('networkidle');

    // 驗證日期顯示
    const dateElement = page.locator('text=/\\d{4}-\\d{2}-\\d{2}|年|月|日/');
    await expect(dateElement).toBeVisible();

    // 驗證溫度顯示
    const temperature = page.locator('text=/\\d+°C/');
    await expect(temperature).toBeVisible();
  });

  test('可以向前後瀏覽歷史天氣', async ({ page }) => {
    await page.goto('/');

    // 點擊歷史標籤
    await page.locator('text=歷史').click();

    await page.waitForLoadState('networkidle');

    // 驗證歷史列表存在
    const historyList = page.locator('text=/歷史|日期/').first();
    await expect(historyList).toBeVisible();

    // 向下滾動查看更多歷史記錄
    await page
      .locator('text=天氣')
      .nth(0)
      .evaluate((el) => {
        el.scrollTop += 300;
      });

    // 驗證可以看到多個記錄
    await expect.poll(() => page.locator('text=/°C/').count()).toBeGreaterThan(0);
  });

  test('歷史天氣應含有風速和濕度資訊', async ({ page }) => {
    await page.goto('/');

    // 點擊歷史標籤
    await page.locator('text=歷史').click();

    await page.waitForLoadState('networkidle');

    // 驗證風速或濕度資訊
    const weatherInfo = page.locator('text=/風|濕|度/');
    await expect(weatherInfo).toBeVisible();
  });

  test('可以查詢特定日期的歷史天氣', async ({ page }) => {
    await page.goto('/');

    // 點擊歷史標籤
    await page.locator('text=歷史').click();

    await page.waitForLoadState('networkidle');

    // 如果有日期選擇器，嘗試選擇日期
    const dateSelector = page.locator('input[type="date"]');
    if (await dateSelector.isVisible()) {
      await dateSelector.fill(FIXED_HISTORY_DATE);
      await page.waitForLoadState('networkidle');

      // 驗證結果更新
      const tempData = page.locator('text=/°C/');
      await expect(tempData).toBeVisible();
    }
  });
});
