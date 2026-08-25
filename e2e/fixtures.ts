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
    await use(context);
  },
});

export { expect };
