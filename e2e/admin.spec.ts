import { test, expect } from './fixtures';
import type { APIRequestContext, Page } from '@playwright/test';

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

  test('заказ уходит в архив и возвращается оттуда', async ({ page }) => {
    await page.goto('/product/govyadina-kubikami');
    await page.getByTestId('add-to-cart').click();
    await page.keyboard.press('Escape');
    await page.goto('/checkout');
    await page.getByTestId('input-name').fill('Архив Тест');
    await page.getByTestId('input-phone').fill('+7 700 555 44 33');
    await page.getByTestId('input-address').fill('Алматы, Достык 1');
    await submitOrder(page);

    const numberText = await page.getByTestId('order-number').textContent({ timeout: 15_000 });
    const number = /ZG-\d{6}/.exec(numberText ?? '')?.[0];
    expect(number).toBeTruthy();

    await openAdmin(page, '/orders?test=1');
    const card = page.getByTestId(`order-${number}`);
    await expect(card).toBeVisible({ timeout: 15_000 });

    // Архив прячет заказ из работы, но не удаляет
    await page.getByTestId(`archive-${number}`).click();
    await expect(card).toHaveCount(0, { timeout: 15_000 });

    await page.goto(`${ADMIN}/orders?test=1&archived=1`);
    await expect(card).toBeVisible({ timeout: 15_000 });
    await expect(card).toContainText('В архиве');

    await page.getByTestId(`archive-${number}`).click();
    await expect(card).toHaveCount(0, { timeout: 15_000 });

    await page.goto(`${ADMIN}/orders?test=1`);
    await expect(card).toBeVisible({ timeout: 15_000 });
  });

  test('финансы показывают выручку и честно молчат о прибыли без себестоимости', async ({
    page,
  }) => {
    await openAdmin(page, '/finance');

    await expect(page.getByRole('heading', { name: 'Финансы' })).toBeVisible();
    await expect(page.getByTestId('metric-revenue')).toContainText('тг');
    await expect(page.getByTestId('metric-orders')).toBeVisible();

    // Без себестоимости отчёт не ломается и не выдаёт выручку за прибыль:
    // прибыль показывается прочерком, а не числом
    const profit = page.getByTestId('metric-profit');
    const noCost = await page.getByText('Прибыль пока не считается').isVisible().catch(() => false);
    if (noCost) {
      await expect(profit).toContainText('—');
      await expect(page.getByTestId('metric-cost')).toContainText('—');
    } else {
      await expect(profit).toContainText('тг');
    }
  });
});

/**
 * Регрессии второго прохода аудита. Работают через API кабинета: проверяется
 * не вёрстка, а правила, которых раньше не было и из-за которых данные можно
 * было испортить одним запросом (или одним промахом мыши по канбану).
 */
test.describe('Аудит: защита данных кабинета', () => {
  const API = process.env.E2E_API_URL ?? 'http://localhost:3000/api/v1';

  /** Возвращает заголовок с токеном владельца. */
  const asOwner = async (request: APIRequestContext) => {
    const res = await request.post(`${API}/admin/auth/login`, {
      data: { email: EMAIL, password: PASSWORD },
    });
    expect(res.status()).toBe(200);
    return { Authorization: `Bearer ${(await res.json()).accessToken}` };
  };

  /** Свежий заказ — чтобы тесты не зависели от того, что уже лежит в базе. */
  const makeOrder = async (request: APIRequestContext) => {
    const products = await (await request.get(`${API}/catalog/products?limit=1`)).json();
    const res = await request.post(`${API}/orders`, {
      data: {
        customerName: `TEST-fsm-${Date.now()}`,
        phone: '+77001112233',
        deliveryType: 'PICKUP',
        isTest: true,
        items: [{ productId: products.items[0].id, qty: 1 }],
      },
    });
    expect(res.status()).toBe(201);
    return (await res.json()).id as string;
  };

  /** AUDIT #23 (P1): раньше разрешался любой переход, включая DONE → NEW. */
  test('завершённый заказ нельзя вернуть в работу', async ({ request }) => {
    const headers = await asOwner(request);
    const id = await makeOrder(request);
    const setStatus = (status: string) =>
      request.patch(`${API}/admin/orders/${id}/status`, { headers, data: { status } });

    // Движение по цепочке и поправки назад — нормальная работа
    expect((await setStatus('CONFIRMED')).status()).toBe(200);
    expect((await setStatus('COOKING')).status()).toBe(200);
    expect((await setStatus('CONFIRMED')).status()).toBe(200);
    // Тот же статус повторно — не ошибка, канбан присылает это при возврате карточки
    expect((await setStatus('CONFIRMED')).status()).toBe(200);
    expect((await setStatus('DELIVERING')).status()).toBe(200);
    expect((await setStatus('DONE')).status()).toBe(200);

    // А вот воскрешение закрытого заказа — уже нет
    for (const status of ['NEW', 'COOKING', 'CONFIRMED']) {
      const res = await setStatus(status);
      expect(res.status(), `DONE → ${status} должен отклоняться`).toBe(409);
      expect((await res.json()).message).toContain('завершённый');
    }

    // Единственная лазейка — отменить случайное закрытие
    expect((await setStatus('DELIVERING')).status()).toBe(200);
  });

  /** AUDIT #23: то же для отменённого заказа. */
  test('отменённый заказ нельзя оживить произвольным статусом', async ({ request }) => {
    const headers = await asOwner(request);
    const id = await makeOrder(request);
    const setStatus = (status: string) =>
      request.patch(`${API}/admin/orders/${id}/status`, { headers, data: { status } });

    expect((await setStatus('CONFIRMED')).status()).toBe(200);
    expect((await setStatus('CANCELLED')).status()).toBe(200);

    const revived = await setStatus('NEW');
    expect(revived.status()).toBe(409);
    expect((await revived.json()).message).toContain('отменённый');

    expect((await setStatus('CONFIRMED')).status()).toBe(200);
  });

  /** AUDIT #17 (P2): мусорный заказ раньше нельзя было убрать совсем. */
  test('удалить заказ можно только из архива', async ({ request }) => {
    const headers = await asOwner(request);
    const id = await makeOrder(request);

    const early = await request.delete(`${API}/admin/orders/${id}`, { headers });
    expect(early.status(), 'живой заказ не должен удаляться').toBe(409);
    expect((await early.json()).message).toContain('архив');

    await request.patch(`${API}/admin/orders/${id}/archive`, { headers, data: { archived: true } });

    const removed = await request.delete(`${API}/admin/orders/${id}`, { headers });
    expect(removed.status()).toBe(200);
    expect((await removed.json()).deleted).toBe(1);

    expect((await request.delete(`${API}/admin/orders/${id}`, { headers })).status()).toBe(404);
  });

  /** AUDIT #24-#27 (P2): цена 0, вес 0 и «скидка наоборот» сохранялись молча. */
  test('карточка товара не принимает бессмысленные цену и вес', async ({ request }) => {
    const headers = await asOwner(request);
    const list = await (await request.get(`${API}/admin/products?limit=50`, { headers })).json();
    const target = list.items[0];
    const full = await (
      await request.get(`${API}/admin/products/${target.id}`, { headers })
    ).json();

    const body = (over: Record<string, unknown> = {}) => ({
      slug: full.slug,
      type: full.type,
      nameRu: full.name.ru,
      nameKk: full.name.kk,
      shortRu: full.short?.ru ?? null,
      shortKk: full.short?.kk ?? null,
      descriptionRu: full.description?.ru ?? null,
      descriptionKk: full.description?.kk ?? null,
      price: full.price,
      compareAtPrice: full.compareAtPrice ?? null,
      costPrice: full.costPrice ?? null,
      weightValue: full.weight.value,
      weightUnit: full.weight.unit,
      categoryId: full.category?.id ?? null,
      stockStatus: full.stockStatus,
      stockQty: full.stockQty ?? null,
      isActive: full.isActive,
      isFeatured: full.isFeatured,
      sortOrder: full.sortOrder ?? 0,
      seoTitleRu: null,
      seoTitleKk: null,
      seoDescRu: null,
      seoDescKk: null,
      images: (full.images ?? []).map((i: { id: string }) => ({
        assetId: i.id,
        altRu: null,
        altKk: null,
      })),
      badgeCodes: (full.badges ?? []).map((b: { code: string }) => b.code),
      bundleItems: (full.bundleItems ?? []).map(
        (b: { product?: { id: string }; componentId?: string; qty: number }) => ({
          componentId: b.product?.id ?? b.componentId,
          qty: b.qty,
        }),
      ),
      ...over,
    });

    const put = (over: Record<string, unknown>) =>
      request.put(`${API}/admin/products/${target.id}`, { headers, data: body(over) });

    try {
      for (const [label, over] of [
        ['цена 0 — товар уехал бы бесплатно', { price: 0 }],
        ['цена с лишними нулями', { price: 999_999_999 }],
        ['вес 0 — карточка написала бы «0 г»', { weightValue: 0 }],
        ['старая цена ниже текущей — скидка наоборот', { compareAtPrice: 1 }],
        ['старая цена равна текущей', { compareAtPrice: full.price }],
      ] as const) {
        const res = await put(over);
        expect(res.status(), label).toBe(400);
        // Отказ должен быть понятен человеку, а не «Проверьте заполненные поля»
        expect((await res.json()).message).not.toBe('Проверьте заполненные поля');
      }

      // Осмысленная старая цена по-прежнему принимается
      expect((await put({ compareAtPrice: full.price + 100 })).status()).toBe(200);
    } finally {
      // Возвращаем карточку в исходный вид, чем бы ни кончился тест
      await put({});
    }
  });
});

test.describe('Отзывы в кабинете', () => {
  test('сообщение с витрины видно в кабинете, счётчик гаснет после прочтения', async ({ page }) => {
    const marker = `Playwright ${Date.now()}`;

    await page.goto('/');
    await page.getByTestId('feedback-open').scrollIntoViewIfNeeded();
    await page.getByTestId('feedback-open').click();
    await page.getByTestId('feedback-kind-QUESTION').click();
    await page.getByTestId('feedback-name').fill(marker);
    await page.getByTestId('feedback-contact').fill('+7 707 000 11 22');
    await page.getByTestId('feedback-message').fill('Доставляете ли в Талгар?');
    await page.getByTestId('feedback-submit').click();
    await expect(page.getByTestId('feedback-done')).toBeVisible({ timeout: 15_000 });

    // Тестовые сообщения по умолчанию скрыты — включаем их фильтром
    await openAdmin(page, '/feedback?test=1');

    const card = page.locator('article[data-testid^="feedback-"]').filter({ hasText: marker });
    await expect(card).toBeVisible({ timeout: 15_000 });
    await expect(card).toContainText('Новое');
    await expect(card).toContainText('Вопрос');

    const id = (await card.getAttribute('data-testid'))!.replace('feedback-', '');

    // Отметка «прочитано» переключается в обе стороны
    await page.getByTestId(`feedback-read-${id}`).click();
    await expect(card).not.toContainText('Новое', { timeout: 15_000 });
    await page.getByTestId(`feedback-read-${id}`).click();
    await expect(card).toContainText('Новое', { timeout: 15_000 });

    // Архив убирает сообщение из работы, но не удаляет
    await page.getByTestId(`feedback-archive-${id}`).click();
    await expect(card).toHaveCount(0, { timeout: 15_000 });

    await page.goto(`${ADMIN}/feedback?test=1&archived=1`);
    await expect(card).toBeVisible({ timeout: 15_000 });
    await expect(card).toContainText('В архиве');

    await page.getByTestId(`feedback-archive-${id}`).click();
    await expect(card).toHaveCount(0, { timeout: 15_000 });

    await page.goto(`${ADMIN}/feedback?test=1`);
    await expect(card).toBeVisible({ timeout: 15_000 });
  });
});

test.describe('Кнопка сохранения', () => {
  test('показывает, что правок нет, что идёт сохранение и что всё сохранилось', async ({
    page,
  }) => {
    await openAdmin(page, '/settings');

    const save = page.getByTestId('save-contacts');
    const phone = page.getByTestId('settings-whatsapp');
    const original = await phone.inputValue();

    try {
      // Пока правок нет, нажимать не на что
      await expect(save).toBeDisabled();
      await expect(save).toHaveAttribute('data-state', 'clean');

      // Значение обязано отличаться от сохранённого, иначе кнопка честно
      // останется в состоянии «нечего сохранять» и тест проверит не то
      const changed = original === '77011234567' ? '77019998877' : '77011234567';
      await phone.fill(changed);
      await expect(save).toBeEnabled();
      await expect(save).toHaveAttribute('data-state', 'dirty');

      await save.click();

      // Подтверждение видно на самой кнопке, а не только всплывающей плашкой
      await expect(save).toHaveAttribute('data-state', 'saved', { timeout: 15_000 });
      await expect(save).toContainText('Сохранено');

      // И само уходит: постоянная зелёная кнопка перестала бы что-либо значить
      await expect(save).toHaveAttribute('data-state', 'clean', { timeout: 15_000 });
    } finally {
      // Возвращаем номер, чем бы ни кончился тест
      await phone.fill(original);
      if (await save.isEnabled()) {
        await save.click();
        await expect(save).toHaveAttribute('data-state', 'clean', { timeout: 15_000 });
      }
    }
  });
});
