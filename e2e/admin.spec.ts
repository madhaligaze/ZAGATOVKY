import { test, expect } from './fixtures';
import type { Page } from '@playwright/test';

/**
 * Прогоны против дев-стека: тесты создают и меняют данные.
 * @smoke здесь только один — проверка, что кабинет вообще отвечает и просит войти.
 */

const ADMIN = process.env.E2E_ADMIN_BASE_URL ?? 'http://localhost:5174';
const EMAIL = process.env.E2E_ADMIN_EMAIL ?? 'owner@zagatovky.kz';
const PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? 'zagatovky123';

/** Кнопка отправки заказа отличается на телефоне и десктопе — кликаем видимую. */
const submitOrder = async (page: Page) => {
  await page.locator('[data-testid^="submit-order"]:visible').click();
};

/** Вход в кабинет и переход к нужному разделу. */
const openAdmin = async (page: Page, path = '/') => {
  await page.goto(`${ADMIN}/login`);
  await page.getByTestId('login-email').fill(EMAIL);
  await page.getByTestId('login-password').fill(PASSWORD);
  await page.getByTestId('login-submit').click();
  await expect(page.getByRole('link', { name: 'Товары' })).toBeVisible({ timeout: 20_000 });

  if (path !== '/') await page.goto(`${ADMIN}${path}`);
};

test.describe('Доступ в кабинет', () => {
  test('@smoke без входа кабинет показывает форму логина', async ({ page }) => {
    await page.goto(`${ADMIN}/products`);
    await expect(page.getByTestId('login-email')).toBeVisible();
    await expect(page.getByTestId('login-submit')).toBeVisible();
  });

  test('неверный пароль не пускает внутрь', async ({ page }) => {
    await page.goto(`${ADMIN}/login`);
    await page.getByTestId('login-email').fill(EMAIL);
    await page.getByTestId('login-password').fill('заведомо-неверный');
    await page.getByTestId('login-submit').click();

    await expect(page.getByText(/Неверная почта или пароль/)).toBeVisible();
    await expect(page.getByTestId('login-email')).toBeVisible();
  });
});

test.describe('Админ-кабинет', () => {
  test('вход, дашборд и командная палитра', async ({ page }) => {
    await openAdmin(page);

    await expect(page.getByRole('heading', { name: 'Заказы', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Требует внимания' })).toBeVisible();

    await page.keyboard.press('Control+k');
    await expect(page.getByPlaceholder('Товар, заказ или действие…')).toBeVisible();
    await page.keyboard.type('Свекла');
    await expect(page.getByRole('option', { name: /Свекла/ }).first()).toBeVisible();
    await page.keyboard.press('Escape');
  });

  test('настройки рабочего места переживают перезагрузку', async ({ page }) => {
    await openAdmin(page);

    await page.getByTitle('Вид кабинета').click();
    await page.getByRole('menuitem', { name: 'Тёмная' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    // Настройки уходят на сервер с задержкой — ждём и перезагружаем
    await page.waitForTimeout(1200);
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark', { timeout: 10_000 });

    // Возвращаем светлую, чтобы не мешать другим прогонам
    await page.getByTitle('Вид кабинета').click();
    await page.getByRole('menuitem', { name: 'Светлая' }).click();
    await page.waitForTimeout(1200);
  });

  test('новый товар появляется на витрине, правка цены доезжает туда же', async ({ page }) => {
    await openAdmin(page);

    const marker = Date.now().toString().slice(-6);
    const name = `Тестовая заготовка ${marker}`;
    const slug = `e2e-test-${marker}`;

    await page.goto(`${ADMIN}/products/new`);
    await page.getByTestId('name-ru').fill(name);
    await page.getByTestId('tab-kk').click();
    await page.getByTestId('name-kk').fill(`Сынақ дайындама ${marker}`);
    await page.getByTestId('price').fill('777');
    await page.getByTestId('weight').fill('150');
    await page.getByPlaceholder('svekla').fill(slug);
    await page.getByTestId('save-product').click();

    await expect(page.getByText('Товар создан')).toBeVisible({ timeout: 15_000 });

    // Витрина отдаёт новый товар
    await page.goto(`/product/${slug}`);
    await expect(page.getByRole('heading', { name, level: 1 })).toBeVisible();
    await expect(page.getByText('777 тг')).toBeVisible();

    // Инлайн-правка цены в таблице
    await page.goto(`${ADMIN}/products`);
    await page.getByTestId('product-search').fill(name);
    const row = page.getByTestId('products-table').locator('tr', { hasText: name });
    await expect(row).toBeVisible({ timeout: 10_000 });

    await row.getByTitle('Изменить цену').click();
    await page.keyboard.press('Control+a');
    await page.keyboard.type('999');
    await page.keyboard.press('Enter');
    await expect(page.getByText(/Обновлено позиций/)).toBeVisible({ timeout: 10_000 });

    await page.goto(`/product/${slug}`);
    await expect(page.getByText('999 тг')).toBeVisible({ timeout: 10_000 });

    // Убираем за собой
    await page.goto(`${ADMIN}/products`);
    await page.getByTestId('product-search').fill(name);
    await page.getByRole('link', { name }).click();
    page.once('dialog', (dialog) => void dialog.accept());
    await page.getByRole('button', { name: 'Удалить' }).click();
    await expect(page.getByText('Товар удалён')).toBeVisible({ timeout: 10_000 });
  });

  test('скрытый товар исчезает с витрины', async ({ page }) => {
    await openAdmin(page, '/products');
    await page.getByTestId('product-search').fill('Морковь');

    const row = page.getByTestId('products-table').locator('tr', { hasText: 'Морковь' });
    await expect(row).toBeVisible({ timeout: 10_000 });
    await row.getByText('Показан').click();
    await expect(page.getByText(/Обновлено позиций/)).toBeVisible({ timeout: 10_000 });

    const response = await page.request.get(
      `${process.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1'}/catalog/products/morkov`,
    );
    expect(response.status()).toBe(404);

    // Возвращаем как было
    await page.goto(`${ADMIN}/products`);
    await page.getByTestId('product-search').fill('Морковь');
    const back = page.getByTestId('products-table').locator('tr', { hasText: 'Морковь' });
    await expect(back).toBeVisible({ timeout: 10_000 });
    await back.getByText('Скрыт').click();
    await expect(page.getByText(/Обновлено позиций/)).toBeVisible({ timeout: 10_000 });
  });

  test('заказ с витрины виден в канбане и меняет статус', async ({ page }) => {
    // Оформляем заказ на витрине
    await page.goto('/product/govyadina-kubikami');
    await page.getByTestId('add-to-cart').click();
    await page.keyboard.press('Escape');
    await page.goto('/checkout');
    await page.getByTestId('input-name').fill('Канбан Тест');
    await page.getByTestId('input-phone').fill('+7 700 555 44 33');
    await page.getByTestId('input-address').fill('Алматы, Достык 1');
    await submitOrder(page);

    const numberText = await page
      .getByTestId('order-number')
      .textContent({ timeout: 15_000 });
    const number = /ZG-\d{6}/.exec(numberText ?? '')?.[0];
    expect(number).toBeTruthy();

    // Ищем его в кабинете среди тестовых
    await openAdmin(page, '/orders?test=1');

    const card = page.getByTestId(`order-${number}`);
    await expect(card).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('column-NEW')).toContainText('Канбан Тест');
    await expect(card.getByRole('link', { name: /Написать/ })).toHaveAttribute(
      'href',
      /wa\.me\/77005554433/,
    );
  });
});
