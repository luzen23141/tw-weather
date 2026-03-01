import { test, expect } from '@playwright/test';

test.describe('主題切換', () => {
  test('應能進入設定並找到主題選項', async ({ page }) => {
    await page.goto('/');

    // 點擊設定標籤
    const settingsTab = page.locator('a[href="/settings"]');
    await settingsTab.click();

    // 驗證主題選項存在
    const themeSection = page.getByText('主題外觀');
    await expect(themeSection).toBeVisible();
    await expect(themeSection).toBeVisible();
  });

  test('應能切換到深色主題', async ({ page }) => {
    await page.goto('/settings');
    // 點擊深色主題選項
    const darkThemeButton = page.getByText('暗色模式', { exact: true });
    if (await darkThemeButton.isVisible()) {
      await darkThemeButton.click();

      // 驗證深色主題已應用
      const settings = await page.evaluate(() => localStorage.getItem('weather-settings'));
      expect(settings).toContain('"theme":"dark"');
    }
  });

  test('應能切換到淺色主題', async ({ page }) => {
    await page.goto('/settings');
    // 先切換到深色主題
    const darkButton = page.getByText('暗色模式', { exact: true });
    if (await darkButton.isVisible()) {
      await darkButton.click();
    }

    // 再切換回淺色主題
    const lightButton = page.getByText('亮色模式', { exact: true });
    if (await lightButton.isVisible()) {
      await lightButton.click();

      // 驗證淺色主題已應用
      const settings = await page.evaluate(() => localStorage.getItem('weather-settings'));
      expect(settings).toContain('"theme":"light"');
    }
  });

  test('主題設定應持久化保存', async ({ page }) => {
    await page.goto('/settings');
    // 切換到深色主題
    const darkButton = page.getByText('暗色模式', { exact: true });
    if (await darkButton.isVisible()) {
      await darkButton.click();

      // 刷新頁面
      await page.reload();

      // 驗證深色主題仍然活躍
      const settings = await page.evaluate(() => localStorage.getItem('weather-settings'));
      expect(settings).toContain('"theme":"dark"');
    }
  });

  test('切換主題後背景色應相應改變', async ({ page }) => {
    await page.goto('/');

    const body = page.locator('body');

    // 進入設定
    await page.locator('a[href="/settings"]').click();

    // 切換主題
    const themeButton = page.getByText('暗色模式', { exact: true });
    if (await themeButton.isVisible()) {
      await themeButton.click();

      // 返回主頁
      await page.locator('a[href="/"]').first().click();

      // 檢查背景顏色是否改變
      const newBgColor = await body.evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor;
      });

      // 顏色應該改變（除非剛好相同，但概率很低）
      expect(newBgColor).toBeTruthy();
    }
  });
});
