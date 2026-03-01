import { test, expect } from '@playwright/test';

test.describe.skip('聚合模式', () => {
  test('應能啟用聚合模式', async ({ page }) => {
    await page.goto('/settings');

    // 向下滾動到聚合模式選項
    await page.locator('text=聚合模式').scrollIntoViewIfNeeded();

    // 驗證聚合模式選項存在
    const aggregateSection = page.locator('text=聚合模式');
    await expect(aggregateSection).toBeVisible();
  });

  test('啟用聚合模式後應顯示溫度範圍', async ({ page }) => {
    await page.goto('/settings');

    // 向下滾動到聚合模式選項
    await page.locator('text=聚合模式').scrollIntoViewIfNeeded();

    // 啟用聚合模式（假設有開關）
    const aggregateToggle = page.locator('input[type="checkbox"]').nth(0);
    const isChecked = await aggregateToggle.isChecked();

    if (!isChecked) {
      await aggregateToggle.click();
    }

    await page.waitForLoadState('networkidle');

    // 返回主頁
    await page.locator('text=天氣').click();

    await page.waitForLoadState('networkidle');

    // 驗證顯示溫度範圍（~符號）
    const tempRange = page.locator('text=/~|範圍/');
    await expect(tempRange).toBeVisible();
  });

  test('可以禁用聚合模式', async ({ page }) => {
    await page.goto('/settings');

    // 向下滾動到聚合模式選項
    await page.locator('text=聚合模式').scrollIntoViewIfNeeded();

    // 禁用聚合模式
    const aggregateToggle = page.locator('input[type="checkbox"]').nth(0);
    const isChecked = await aggregateToggle.isChecked();

    if (isChecked) {
      await aggregateToggle.click();
    }

    await page.waitForLoadState('networkidle');

    // 驗證設定已保存
    const toggleState = await aggregateToggle.isChecked();
    expect(toggleState).toBe(false);
  });

  test('多個資料源聚合應顯示正確的溫度統計', async ({ page }) => {
    await page.goto('/settings');

    // 啟用聚合模式
    const aggregateToggle = page.locator('input[type="checkbox"]').nth(0);
    const isChecked = await aggregateToggle.isChecked();

    if (!isChecked) {
      await aggregateToggle.click();
    }

    await page.waitForLoadState('networkidle');

    // 返回主頁
    await page.locator('text=天氣').click();

    await page.waitForLoadState('networkidle');

    // 驗證溫度範圍顯示（最高溫和最低溫）
    const tempDisplay = page.locator('text=/°C.*~|~.*°C/');
    await expect(tempDisplay).toBeVisible();
  });
});
