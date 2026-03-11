import { test, expect } from '@playwright/test';

/**
 * Smoke Test — 確認基本渲染不崩潰
 *
 * 用途：
 * - 偵測 JS runtime 錯誤（如 React 版本不一致、import.meta SyntaxError）
 * - 防止空白頁面上線
 */
test.describe('Smoke Test', () => {
  test('首頁應正常載入且無 JS 錯誤', async ({ page }) => {
    const errors: string[] = [];

    page.on('pageerror', (err) => {
      errors.push(`PAGE ERROR: ${err.message}`);
    });
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(`CONSOLE ERROR: ${msg.text()}`);
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect
      .poll(() =>
        page.evaluate(() => {
          return document.body.innerText.trim().length;
        }),
      )
      .toBeGreaterThan(10);

    expect(errors, `偵測到 JS 錯誤，頁面可能空白：\n${errors.join('\n')}`).toHaveLength(0);
  });

  test('設定頁應正常載入且無 JS 錯誤', async ({ page }) => {
    const errors: string[] = [];

    page.on('pageerror', (err) => {
      errors.push(`PAGE ERROR: ${err.message}`);
    });
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(`CONSOLE ERROR: ${msg.text()}`);
      }
    });

    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    await expect
      .poll(() =>
        page.evaluate(() => {
          return document.body.innerText.trim().length;
        }),
      )
      .toBeGreaterThan(10);

    expect(errors, `設定頁偵測到 JS 錯誤：\n${errors.join('\n')}`).toHaveLength(0);
  });
});
