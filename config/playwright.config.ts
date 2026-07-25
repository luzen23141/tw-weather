import { defineConfig, devices } from '@playwright/test';
import path from 'path';

export default defineConfig({
  testDir: path.resolve(__dirname, '../e2e'),
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 2,
  reporter: [
    ['html', { open: 'never', outputFolder: path.resolve(__dirname, '../playwright-report') }],
    ['json', { outputFile: path.resolve(__dirname, '../test-results/playwright/results.json') }],
  ],
  use: {
    baseURL: 'http://localhost:8081',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // 使用系統安裝的 Google Chrome，而非 Playwright 自帶的 Chromium。
        //
        // 主因是環境問題：Playwright 的瀏覽器下載在部分網路環境會穩定卡住
        // （實測連續數次僅下載數百 KB 後停滯），導致 E2E 完全無法執行。
        // 用系統 Chrome 可繞過整個下載步驟。
        //
        // 附帶好處是行為更貼近使用者實際看到的瀏覽器 —— 這個 UI 大量依賴
        // backdrop-filter 與玻璃層次，精簡版的 headless shell 未必一致。
        //
        // CI 上若已有 Playwright 瀏覽器快取，可移除此行改用自帶 Chromium。
        channel: process.env.PLAYWRIGHT_CHANNEL ?? 'chrome',
      },
    },
  ],

  webServer: {
    command:
      'EXPO_PUBLIC_PROXY_URL=http://localhost:9999 EXPO_NO_INTERACTIVE=1 pnpm web -- --port 8081',
    url: 'http://localhost:8081',
    reuseExistingServer: !process.env.CI,
    timeout: 180 * 1000,
  },
});
