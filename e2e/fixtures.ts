import { test as base, expect } from '@playwright/test';

/**
 * Помечает всё, что делает браузер под Playwright, как тестовое.
 * Витрина читает этот флаг и проставляет заказу isTest — в админке и статистике
 * такие заявки отфильтрованы и не искажают выручку.
 */
export const test = base.extend({
  context: async ({ context }, use) => {
    await context.addInitScript(() => {
      (window as unknown as { __ZG_E2E__?: boolean }).__ZG_E2E__ = true;
    });

    /*
     * Страница подтверждения сама открывает чат в новой вкладке, и та честно
     * тянет wa.me по сети. При параллельном прогоне четыре таких вкладки
     * упирались в тайм-аут теста — падало не приложение, а ожидание чужого
     * сайта. Ссылки остаются на месте и проверяются по href; сюда мы всё
     * равно не переходим, поэтому глушим запросы наружу.
     */
    await context.route(/^https:\/\/(wa\.me|t\.me|api\.whatsapp\.com|instagram\.com)\//, (route) =>
      route.fulfill({ status: 204, body: '' }),
    );

    await use(context);
  },
});

export { expect };
