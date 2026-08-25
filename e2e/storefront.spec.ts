import type { Page } from '@playwright/test';
import { test, expect } from './fixtures';

/**
 * @smoke — только чтение, безопасно гонять по проду.
 * Тесты без тега создают заказы и рассчитаны на дев-стек.
 */

/**
 * Кнопка отправки заказа зависит от ширины экрана: на телефоне это липкая
 * нижняя панель, на десктопе — кнопка в сводке справа. Кликаем по видимой.
 */
const submitOrder = async (page: Page) => {
  await page.locator('[data-testid^="submit-order"]:visible').click();
};

const dismissCart = async (page: Page) => {
  const drawer = page.getByTestId('cart-drawer');
  if (await drawer.isVisible().catch(() => false)) await page.keyboard.press('Escape');
};

test.describe('Витрина', () => {
  test('@smoke главная отрисовывается со всеми секциями', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('link', { name: 'ZAGATOVKY' }).first()).toBeVisible();

    // Секции главной приходят из API — проверяем, что данные реально доехали
    await expect(page.getByRole('heading', { name: /Готовые наборы/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Как это работает/i })).toBeVisible();
    await expect(page.getByRole('contentinfo')).toBeVisible();
  });

  test('@smoke каталог отдаёт товары и фильтруется по категории', async ({ page }) => {
    await page.goto('/catalog');

    const grid = page.getByTestId('product-grid');
    await expect(grid).toBeVisible();

    const allCount = await grid.locator('article').count();
    expect(allCount).toBeGreaterThan(5);

    await page.getByTestId('filter-myaso').click();
    await expect(page).toHaveURL(/category=myaso/);
    await expect
      .poll(async () => grid.locator('article').count(), { timeout: 7000 })
      .toBeLessThan(allCount);
  });

  test('@smoke карточка товара показывает цену, вес и описание', async ({ page }) => {
    await page.goto('/product/svekla');

    await expect(page.getByRole('heading', { name: 'Свекла', level: 1 })).toBeVisible();
    await expect(page.getByText('330 тг')).toBeVisible();
    await expect(page.getByText('250 г').first()).toBeVisible();
  });

  test('@smoke набор показывает состав и выгоду', async ({ page }) => {
    await page.goto('/product/borshchevoy-nabor');

    await expect(page.getByRole('heading', { name: /Что входит в набор/i })).toBeVisible();
    // 700 тг по отдельности против 640 тг за набор
    await expect(page.getByText('700 тг')).toBeVisible();
    await expect(page.getByText(/Выгода/)).toBeVisible();
  });

  test('@smoke корзина набирается и переживает перезагрузку', async ({ page }) => {
    await page.goto('/catalog');

    await page.getByTestId('add-svekla').click();
    await expect(page.getByTestId('cart-count')).toHaveText('1');

    await page.getByTestId('add-kapusta').click();
    await expect(page.getByTestId('cart-count')).toHaveText('2');

    await page.reload();
    await expect(page.getByTestId('cart-count')).toHaveText('2');

    await page.getByTestId('cart-button').click();
    await expect(page.getByTestId('cart-drawer')).toBeVisible();
    await expect(page.getByTestId('cart-subtotal')).toHaveText('460 тг');
  });

  test('@smoke переключение языка меняет интерфейс и названия товаров', async ({ page }) => {
    await page.goto('/catalog');

    await expect(page.getByRole('heading', { name: 'Каталог заготовок' })).toBeVisible();

    await page.getByTestId('locale-kk').click();

    await expect(page.getByRole('heading', { name: 'Дайындамалар каталогы' })).toBeVisible();
    // Названия товаров тоже двуязычные и приходят из БД
    await expect(page.getByText('Қызылша').first()).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'kk');
  });

  test('оформление заказа доводится до номера ZG-', async ({ page }) => {
    await page.goto('/product/govyadina-kubikami');
    await page.getByTestId('add-to-cart').click();
    await dismissCart(page);

    await page.goto('/checkout');

    await page.getByTestId('input-name').fill('Playwright Тест');
    await page.getByTestId('input-phone').fill('+7 700 123 45 67');
    await page.getByTestId('input-address').fill('Алматы, Абая 10, кв 5');

    await expect(page.getByTestId('checkout-total')).toBeVisible();

    await submitOrder(page);

    await expect(page.getByTestId('order-number')).toContainText(/ZG-\d{6}/, { timeout: 15_000 });
    await expect(page.getByTestId('open-chat')).toHaveAttribute('href', /wa\.me/);
    // Корзина после успешного заказа очищается
    await expect(page.getByTestId('cart-count')).toHaveCount(0);
  });

  test('минимальная сумма заказа с доставкой проверяется на сервере', async ({ page }) => {
    await page.goto('/product/luk-repchatiy');
    await page.getByTestId('add-to-cart').click();
    await dismissCart(page);

    await page.goto('/checkout');
    await page.getByTestId('input-name').fill('Playwright Тест');
    await page.getByTestId('input-phone').fill('+7 700 123 45 67');
    await page.getByTestId('input-address').fill('Алматы, Абая 10');
    await submitOrder(page);

    await expect(page.getByText(/Минимальная сумма заказа/)).toBeVisible();
  });
});
