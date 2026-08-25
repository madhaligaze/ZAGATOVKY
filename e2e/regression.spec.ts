import { test, expect } from './fixtures';

/**
 * Регрессии из предзапускового аудита (см. AUDIT.md).
 *
 * @smoke — только чтение, безопасно гонять по проду.
 * Тесты без тега оформляют заказы и рассчитаны на дев-стек.
 */

const API = process.env.E2E_API_URL ?? 'http://localhost:3000/api/v1';

test.describe('Аудит: регрессии', () => {
  /** AUDIT #1 (P0): ссылка Kaspi без схемы уводила покупателя на сам магазин. */
  test('@smoke ссылка на оплату абсолютная, а не относительная', async ({ request }) => {
    const res = await request.get(`${API}/home`);
    expect(res.status()).toBe(200);
    const { settings } = (await res.json()) as {
      settings: { payment: { kaspiEnabled: boolean; kaspiLink: string } };
    };

    if (!settings.payment.kaspiEnabled || !settings.payment.kaspiLink) test.skip();

    // Без схемы браузер считает href относительным и открывает /pay.kaspi.kz/...
    expect(settings.payment.kaspiLink).toMatch(/^https?:\/\//);
    expect(() => new URL(settings.payment.kaspiLink)).not.toThrow();
    expect(new URL(settings.payment.kaspiLink).hostname).not.toContain('zagatovky');
  });

  /** AUDIT #5 (P1): сервер принимал телефон вообще без цифр. */
  test('@smoke сервер отклоняет телефон без цифр', async ({ request }) => {
    const products = await (await request.get(`${API}/catalog/products?limit=1`)).json();
    const productId = products.items[0].id as string;

    for (const phone of ['++++++++++', '----------', '()()()()()', '(  )  -  + ']) {
      const res = await request.post(`${API}/orders`, {
        data: {
          customerName: 'TEST-regression',
          phone,
          deliveryType: 'PICKUP',
          isTest: true,
          items: [{ productId, qty: 1 }],
        },
      });
      expect(res.status(), `телефон "${phone}" не должен создавать заказ`).toBe(400);
    }
  });

  /** AUDIT #3 (P1): ссылку кидают в WhatsApp — превью собиралось из ничего. */
  test('@smoke у страницы есть OG-теги и картинка превью', async ({ page, request }) => {
    await page.goto('/');

    for (const property of ['og:title', 'og:description', 'og:image', 'og:url']) {
      const content = await page.locator(`meta[property="${property}"]`).getAttribute('content');
      expect(content, `${property} отсутствует`).toBeTruthy();
    }

    // Картинку тянем с проверяемого стенда, а не с прод-домена из тега:
    // иначе тест на дев-стеке проверял бы чужой сервер.
    const image = await page.locator('meta[property="og:image"]').getAttribute('content');
    const onThisHost = new URL(image!, page.url()).pathname;
    const file = await request.get(onThisHost);
    expect(file.status()).toBe(200);
    expect(file.headers()['content-type']).toContain('image');
  });

  /** AUDIT #10 (P2): любой неизвестный адрес молча показывал главную. */
  test('@smoke неизвестный адрес показывает «страницы нет», а не главную', async ({ page }) => {
    await page.goto('/takoy-stranicy-tochno-net-12345');

    await expect(page.getByText(/Такой страницы нет/i)).toBeVisible();
    // Адрес сохраняется: редиректа на / больше нет
    await expect(page).toHaveURL(/takoy-stranicy-tochno-net-12345/);
    await expect(page.getByRole('link', { name: /каталог/i }).first()).toBeVisible();
  });

  /** AUDIT #8 (P2): на iOS Safari каталог уезжал вбок. */
  test('@smoke каталог не создаёт горизонтальный скролл', async ({ page }) => {
    await page.goto('/catalog');
    await expect(page.getByTestId('product-grid')).toBeVisible();

    const { doc, inner } = await page.evaluate(() => ({
      doc: document.documentElement.scrollWidth,
      inner: window.innerWidth,
    }));
    expect(doc, 'страница шире экрана').toBeLessThanOrEqual(inner + 1);
  });

  /** AUDIT #4 (P1): F5 на подтверждении терял номер заказа и ссылку на оплату. */
  test('подтверждение заказа переживает перезагрузку', async ({ page }) => {
    await page.goto('/catalog');
    await page.locator('[data-testid^="add-"]').first().click();

    await page.goto('/checkout');
    // Самовывоз, а не доставка: у доставки может быть минимальная сумма заказа,
    // и тест падал бы от настроек стенда, а не от проверяемой регрессии.
    await page.getByTestId('choice-PICKUP').click();
    await page.getByTestId('input-name').fill(`TEST-${Date.now()}`);
    await page.getByTestId('input-phone').click();
    await page.getByTestId('input-phone').pressSequentially('7001112233', { delay: 20 });
    await page.locator('[data-testid^="submit-order"]:visible').click();

    const number = page.getByTestId('order-number');
    await expect(number).toBeVisible({ timeout: 15_000 });
    const before = await number.innerText();

    await page.reload();

    // Раньше здесь был редирект на главную и заказ терялся вместе со ссылкой на оплату
    await expect(number).toBeVisible();
    expect(await number.innerText()).toBe(before);
  });

  /** AUDIT #11 (P2): вкладки жили каждая со своей корзиной. */
  test('корзина синхронизируется между вкладками', async ({ context }) => {
    const first = await context.newPage();
    await first.goto('/catalog');
    await first.locator('[data-testid^="add-"]').first().click();
    await first.waitForTimeout(300);

    const second = await context.newPage();
    await second.goto('/catalog');
    const counter = second.getByTestId('cart-count');
    await expect(counter).toHaveText('1');

    await first.locator('[data-testid^="add-"]').nth(1).click();

    // Без перезагрузки второй вкладки: раньше счётчик оставался старым,
    // а оформление из неё отправило бы неполный состав.
    await expect(counter).toHaveText('2', { timeout: 5_000 });
  });
});
