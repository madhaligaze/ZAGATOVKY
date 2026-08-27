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
  /*
   * Воркеров намеренно мало.
   *
   * По умолчанию Playwright берёт половину ядер — на восьмиядерной машине это
   * четыре браузера разом. Каждый из них крутит GSAP со ScrollTrigger, инерционную
   * прокрутку, WebGL и анимированное зерно, а на тех же ядрах живут Vite, бэкенд
   * и Postgres. В итоге тесты, завязанные на время (раскрытие по скроллу, инерция,
   * появление секций), падали через раз — причём каждый прогон ронял другой набор.
   *
   * Проверено: mobile в одиночку — 37 из 37 за полторы минуты, он же в общем
   * прогоне на четырёх воркерах падал и тянулся восемь.
   */
  workers: 2,
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
      /*
       * Кабинет ждёт, пока отработают витринные проекты.
       *
       * База у всех трёх одна, а admin создаёт товары, прячет их и меняет цены —
       * то есть правит ровно тот каталог, который desktop и mobile в это же время
       * читают. При fullyParallel это давало плавающие падения: каждый прогон
       * ронял другой набор тестов, потому что проверка успевала прийтись на момент,
       * когда товар уже скрыт, а секция главной из-за этого пуста.
       *
       * Прогон становится длиннее, но его результату можно верить — а ради этого
       * тесты и существуют.
       */
      dependencies: ['desktop', 'mobile'],
      use: {
        ...devices['Desktop Chrome'],
        ...shared,
        viewport: { width: 1500, height: 950 },
      },
    },
  ],
});
