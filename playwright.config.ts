import { defineConfig, devices } from '@playwright/test';

/**
 * Один и тот же набор гоняется по локальному стеку и по проду — цель задаётся
 * переменной E2E_BASE_URL. Тесты с тегом @smoke безопасны везде: они ничего не создают.
 * Остальные создают заказы и правят данные, поэтому только для дев-стека.
 */
const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:5173';

const shared = {
  baseURL,
  trace: 'retain-on-failure' as const,
  screenshot: 'only-on-failure' as const,
  locale: 'ru-RU',
  timezoneId: 'Asia/Almaty',
};

export default defineConfig({
  testDir: './e2e',
  outputDir: './e2e/.artifacts',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [['list'], ['html', { outputFolder: 'e2e/.report', open: 'never' }]],
  timeout: 45_000,
  expect: { timeout: 7_000 },

  use: shared,

  projects: [
    {
      name: 'desktop',
      testIgnore: /admin\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], ...shared, viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'mobile',
      testIgnore: /admin\.spec\.ts/,
      use: { ...devices['Pixel 7'], ...shared },
    },
    {
      name: 'admin',
      testMatch: /admin\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        ...shared,
        viewport: { width: 1500, height: 950 },
      },
    },
  ],
});
