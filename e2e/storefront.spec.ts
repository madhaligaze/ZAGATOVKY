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

  test('блок оплаты Kaspi появляется, когда способ включён в кабинете', async ({ page }) => {
    await page.goto('/product/govyadina-kubikami');
    await page.getByTestId('add-to-cart').click();
    await dismissCart(page);

    await page.goto('/checkout');
    await page.getByTestId('input-name').fill('Playwright Оплата');
    await page.getByTestId('input-phone').fill('+7 700 123 45 67');
    await page.getByTestId('input-address').fill('Алматы, Абая 10');
    await submitOrder(page);

    await expect(page.getByTestId('order-number')).toContainText(/ZG-\d{6}/, { timeout: 15_000 });

    // Способ оплаты включается в настройках, поэтому блок может и отсутствовать —
    // проверяем, что при наличии он показывает сумму заказа и ведёт на Kaspi.
    const payButton = page.getByTestId('pay-kaspi');
    if (await payButton.isVisible().catch(() => false)) {
      await expect(page.getByTestId('payment-amount')).toContainText('4 520 тг');
      await expect(payButton).toHaveAttribute('href', /kaspi/i);
    }
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

  test('@smoke «Наборы» из шапки подсвечиваются фильтром и меняют заголовок', async ({ page }) => {
    await page.goto('/catalog');
    await page.getByTestId('filter-BUNDLE').click();

    await expect(page).toHaveURL(/type=BUNDLE/);
    await expect(page.getByTestId('catalog-title')).toHaveText(/Готовые наборы/);
    await expect(page.getByTestId('filter-BUNDLE')).toHaveAttribute('class', /bg-mountain/);

    // Выбор категории снимает фильтр наборов, а не складывается с ним:
    // иначе каталог оказывался пустым и это выглядело как поломка
    await page.getByTestId('filter-ovoshchi').click();
    await expect(page).toHaveURL(/category=ovoshchi/);
    await expect(page).not.toHaveURL(/type=BUNDLE/);
  });

  test('@smoke позицию из корзины можно убрать и вернуть', async ({ page }) => {
    await page.goto('/product/govyadina-kubikami');
    await page.getByTestId('add-to-cart').click();
    await page.getByTestId('cart-button').click();

    const items = page.getByTestId('cart-drawer').locator('li');
    await expect(items).toHaveCount(1);

    await page.getByTestId('remove-govyadina-kubikami').click();
    await expect(items).toHaveCount(0);

    await page.getByTestId('cart-undo-button').click();
    await expect(items).toHaveCount(1);
  });

  test('@smoke телефон вводится по казахстанской маске и не переполняется', async ({ page }) => {
    await page.goto('/product/govyadina-kubikami');
    await page.getByTestId('add-to-cart').click();
    await dismissCart(page);
    await page.goto('/checkout');

    const phone = page.getByTestId('input-phone');
    await phone.click();
    await phone.pressSequentially('7071234567');
    await expect(phone).toHaveValue('(707) 123-45-67');

    // Одиннадцатая цифра не должна сдвигать номер и портить его с начала
    await phone.pressSequentially('999');
    await expect(phone).toHaveValue('(707) 123-45-67');

    // Вставка с кодом страны и через восьмёрку приводится к тому же виду
    await phone.fill('+77071234567');
    await expect(phone).toHaveValue('(707) 123-45-67');
    await phone.fill('87071234567');
    await expect(phone).toHaveValue('(707) 123-45-67');
  });

  test('@smoke заполненная форма заказа переживает уход в каталог', async ({ page }) => {
    await page.goto('/product/govyadina-kubikami');
    await page.getByTestId('add-to-cart').click();
    await dismissCart(page);
    await page.goto('/checkout');

    await page.getByTestId('input-name').fill('Черновик Тест');
    await page.getByTestId('input-phone').fill('+7 707 111 22 33');
    await page.getByTestId('input-address').fill('Алматы, Абая 10');

    await page.goto('/catalog');
    await page.goto('/checkout');

    await expect(page.getByTestId('input-name')).toHaveValue('Черновик Тест');
    await expect(page.getByTestId('input-phone')).toHaveValue('(707) 111-22-33');
    await expect(page.getByTestId('input-address')).toHaveValue('Алматы, Абая 10');
    await expect(page.getByTestId('draft-note')).toBeVisible();
  });

  test('@smoke внутренние страницы открываются сверху, а не в подвале', async ({ page }) => {
    await page.goto('/');
    await page.mouse.wheel(0, 3000);
    await page.waitForTimeout(400);

    await page.getByRole('link', { name: 'Каталог', exact: true }).first().click();
    await page.waitForTimeout(600);
    expect(await page.evaluate(() => window.scrollY)).toBeLessThan(50);
  });

  test('@smoke приглашение написать нам стоит перед «Частыми вопросами»', async ({ page }) => {
    await page.goto('/');

    const block = page.getByTestId('feedback-section');
    await expect(block).toBeVisible();
    await expect(block.getByRole('heading', { level: 2 })).toContainText(/больше продуктов|көргіңіз/i);

    // Порядок важен: если человек дочитал до вопросов и своего не нашёл,
    // задать его должно быть можно тут же, а не искать контакты в подвале
    const order = await page.evaluate(() => {
      // Array.from, а не spread: NodeList в целевой библиотеке TS не итерируемый
      const sections = Array.from(document.querySelectorAll('section'));
      const feedback = sections.findIndex((el) => el.dataset.testid === 'feedback-section');
      const faq = sections.findIndex((el) => /Частые вопросы|Жиі қойылатын/i.test(el.textContent ?? ''));
      return { feedback, faq };
    });
    expect(order.feedback).toBeGreaterThanOrEqual(0);
    if (order.faq >= 0) expect(order.feedback).toBeLessThan(order.faq);
  });

  test('@smoke пустое сообщение не отправляется', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('feedback-open').scrollIntoViewIfNeeded();
    await page.getByTestId('feedback-open').click();

    await expect(page.getByTestId('feedback-dialog')).toBeVisible();
    await page.getByTestId('feedback-submit').click();

    // Диалог остаётся открытым, а не закрывается с пустой заявкой
    await expect(page.getByTestId('feedback-dialog')).toBeVisible();
    await expect(page.getByTestId('feedback-done')).toHaveCount(0);
    await expect(page.getByText('Напишите, как к вам обращаться')).toBeVisible();
  });

  test('сообщение с витрины доходит до благодарности', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('feedback-open').scrollIntoViewIfNeeded();
    await page.getByTestId('feedback-open').click();

    await page.getByTestId('feedback-kind-WISH').click();
    await page.getByTestId('feedback-name').fill('Playwright Пожелание');
    await page.getByTestId('feedback-contact').fill('+7 707 000 11 22');
    await page.getByTestId('feedback-message').fill('Хотелось бы видеть грибы и шпинат.');
    await page.getByTestId('feedback-submit').click();

    await expect(page.getByTestId('feedback-done')).toBeVisible({ timeout: 15_000 });

    // Повторное открытие даёт чистую форму, а не прошлый экран «спасибо»
    await page.getByTestId('feedback-done').getByRole('button', { name: 'Закрыть' }).click();
    await page.getByTestId('feedback-open').click();
    await expect(page.getByTestId('feedback-name')).toHaveValue('');
    await expect(page.getByTestId('feedback-done')).toHaveCount(0);
  });
});

test.describe('Оформление и движение', () => {
  test('@smoke кинетическая лента и зерно есть на первом экране', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByTestId('grain')).toBeAttached();
    await expect(page.getByTestId('hero-band')).toBeAttached();

    // Лента декоративная: её текста быть не должно в доступном дереве,
    // иначе скринридер прочитает слово трижды подряд
    await expect(page.getByTestId('kinetic-band')).toHaveAttribute('aria-hidden', 'true');
  });

  test('@smoke заголовок разбит на буквы, но читается целиком', async ({ page }) => {
    await page.goto('/');

    const heading = page.locator('h2:has(.split-char)').first();
    await expect(heading).toBeVisible();

    // Буквы скрыты от скринридера, а исходная строка отдана через aria-label —
    // иначе заголовок произносился бы по одному символу
    const label = await heading.getAttribute('aria-label');
    expect(label && label.length > 3).toBeTruthy();
    await expect(heading.locator('.split-word').first()).toHaveAttribute('aria-hidden', 'true');
  });

  test('@smoke карточки раскрываются по мере прокрутки', async ({ page }) => {
    await page.goto('/catalog');
    await expect(page.getByTestId('product-grid')).toBeVisible();

    const masks = () =>
      page.evaluate(() =>
        Array.from(document.querySelectorAll('[data-testid="reveal-frame"]')).map((el) => ({
          belowFold: el.getBoundingClientRect().top > window.innerHeight,
          clip: getComputedStyle(el).clipPath,
        })),
      );

    // Ниже сгиба кадры ещё закрыты маской — иначе раскрывать было бы нечего
    const before = await masks();
    expect(before.length).toBeGreaterThan(0);
    expect(before.some((m) => m.belowFold && m.clip !== 'inset(0%)')).toBeTruthy();

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2500);

    // После прокрутки не осталось ни одного нераскрытого кадра
    const after = await masks();
    expect(after.every((m) => m.clip === 'inset(0%)')).toBeTruthy();
  });
});

test.describe('Тяжёлые эффекты знают своё место', () => {
  test('на телефоне курсор и WebGL не грузятся вовсе', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Проверяем именно мобильное поведение');

    const heavy: string[] = [];
    page.on('request', (request) => {
      if (/DesktopLayer|CustomCursor|HeroFlowmap/.test(request.url())) heavy.push(request.url());
    });

    await page.goto('/');
    await page.waitForTimeout(1500);

    // Зерно — чистый CSS, оно уместно везде
    await expect(page.getByTestId('grain')).toBeAttached();

    // А вот курсор и искажение на телефоне бессмысленны: их код не должен
    // даже скачиваться, иначе мобильный трафик платит за то, чего не увидит
    await expect(page.getByTestId('cursor')).toHaveCount(0);
    await expect(page.getByTestId('hero-flowmap')).toHaveCount(0);
    expect(heavy).toEqual([]);
  });

  test('при «меньше движения» контент виден сразу и без инерции', async ({ browser }) => {
    const context = await browser.newContext({
      reducedMotion: 'reduce',
      viewport: { width: 1440, height: 900 },
    });
    const page = await context.newPage();

    await page.goto('/catalog');
    await page.waitForTimeout(1200);

    // Ни один кадр не остаётся скрытым маской: анимации нет, есть конечное состояние
    const clips = await page.evaluate(() =>
      Array.from(document.querySelectorAll('[data-testid="reveal-frame"]')).map(
        (el) => getComputedStyle(el).clipPath,
      ),
    );
    expect(clips.length).toBeGreaterThan(0);
    expect(clips.every((c) => c === 'inset(0%)' || c === 'none')).toBeTruthy();

    // Прокрутка обычная: инерции быть не должно
    await page.mouse.wheel(0, 400);
    await page.waitForTimeout(60);
    const early = await page.evaluate(() => Math.round(window.scrollY));
    await page.waitForTimeout(800);
    const settled = await page.evaluate(() => Math.round(window.scrollY));
    expect(Math.abs(settled - early)).toBeLessThan(30);

    await context.close();
  });
});
