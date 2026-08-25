import { useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { CreditCard, Trash2 } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { useCart, selectSubtotal } from '@/store/cart';
import { useCheckoutDraft, isDraftFilled } from '@/store/checkout';
import {
  formatKzNational,
  isCompleteKzPhone,
  parseKzPhoneInput,
  toE164,
} from '@/lib/phone';
import { usePublicSettings } from '@/hooks/usePublicSettings';
import { useLocale } from '@/hooks/useLocale';
import { Button } from '@/components/ui/Button';
import { ProductMedia } from '@/components/catalog/ProductMedia';
import { formatPrice, formatWeight, pick } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { CreatedOrder } from '@/types/catalog';

/** Пилюли-переключатели вместо радиокнопок — тот же язык форм, что и у фильтров. */
const Choice = <T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) => (
  <fieldset>
    <legend className="eyebrow mb-3 text-stone">{label}</legend>
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          aria-pressed={value === option.value}
          data-testid={`choice-${option.value}`}
          className={cn(
            'rounded-pill border px-5 py-2.5 text-caption uppercase tracking-[0.125em] transition-colors',
            value === option.value
              ? 'border-mountain bg-mountain text-parchment'
              : 'border-hairline text-mountain hover:border-teal hover:bg-parchment',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  </fieldset>
);

const Field = ({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) => (
  <label className="flex flex-col gap-2">
    <span className="eyebrow text-stone">{label}</span>
    {children}
    {/* Строка подсказки есть всегда: иначе появление ошибки дёргает вёрстку
        и соседние поля разъезжаются по высоте. */}
    <span
      className={cn(
        'min-h-5 text-body-sm leading-5',
        error ? 'text-[#b23b3b]' : 'text-stone',
      )}
    >
      {error ?? hint ?? ''}
    </span>
  </label>
);

const inputClass =
  'w-full border-b border-hairline-strong bg-transparent py-3 text-body text-mountain outline-none transition-colors placeholder:text-stone-light focus:border-teal';

export const CheckoutPage = () => {
  const { t, locale } = useLocale();
  const navigate = useNavigate();
  const { data: settings } = usePublicSettings();

  const items = useCart((state) => state.items);
  const subtotal = useCart(selectSubtotal);
  const clear = useCart((state) => state.clear);
  const removeItem = useCart((state) => state.remove);

  // Форма живёт в сохраняемом черновике, а не в локальном useState: уход в каталог
  // за добавкой больше не стирает уже введённые имя, телефон и адрес.
  const draft = useCheckoutDraft();
  const setDraft = useCheckoutDraft((state) => state.set);
  const resetDraft = useCheckoutDraft((state) => state.reset);

  const {
    customerName,
    phoneDigits,
    address,
    comment,
    channel,
    deliveryType,
    customerType,
  } = draft;

  const phoneRef = useRef<HTMLInputElement>(null);
  const [honeypot, setHoneypot] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const onPhoneChange = (raw: string) => {
    const digits = parseKzPhoneInput(raw, phoneDigits);
    setDraft({ phoneDigits: digits });

    const input = phoneRef.current;
    if (!input) return;

    /*
     * Приводим поле к каноничному виду сразу, а не в следующем кадре.
     *
     * Когда введённое отбрасывается — например, одиннадцатая цифра — состояние не
     * меняется, React не трогает DOM, и лишний символ остаётся в поле видимым.
     * Отложенная правка не спасает: при быстром наборе следующее нажатие приходит
     * раньше кадра и разбирается уже по испорченной строке.
     */
    input.value = formatKzNational(digits);

    // Маска фиксированной длины: курсор всегда в конце, иначе после перерисовки
    // React ставит его по старому индексу и ввод «прыгает» через разделители.
    if (document.activeElement !== input) return;
    const end = input.value.length;
    input.setSelectionRange(end, end);
  };

  const deliveryFee =
    settings && deliveryType === 'DELIVERY'
      ? settings.delivery.freeFrom !== null && subtotal >= settings.delivery.freeFrom
        ? 0
        : settings.delivery.baseFee
      : 0;

  const mutation = useMutation({
    mutationFn: api.createOrder,
    onSuccess: (order: CreatedOrder) => {
      clear();
      // Черновик очищаем только здесь: заказ ушёл, повторно вводить нечего.
      resetDraft();
      // Заказ уже в БД — дальше только показываем номер и ссылку в чат.
      navigate('/success', { state: { order, channel }, replace: true });
    },
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    const nextErrors: Record<string, string> = {};
    if (customerName.trim().length < 2) nextErrors.customerName = t('checkout.errors.name');
    if (!isCompleteKzPhone(phoneDigits)) nextErrors.phone = t('checkout.errors.phone');
    if (deliveryType === 'DELIVERY' && address.trim().length < 5) {
      nextErrors.address = t('checkout.errors.address');
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    mutation.mutate({
      customerName: customerName.trim(),
      phone: toE164(phoneDigits),
      channel,
      customerType,
      deliveryType,
      address: deliveryType === 'DELIVERY' ? address.trim() : undefined,
      comment: comment.trim() || undefined,
      locale,
      website: honeypot,
      // Прогоны Playwright ставят этот флаг в контексте страницы, чтобы их заявки
      // не смешивались с настоящими в админке и не попадали в статистику.
      isTest: Boolean((window as unknown as { __ZG_E2E__?: boolean }).__ZG_E2E__),
      items: items.map((item) => ({ productId: item.product.id, qty: item.qty })),
    });
  };

  if (items.length === 0) {
    return (
      <div className="grid min-h-[60vh] place-items-center px-6 text-center">
        <div className="flex flex-col items-center gap-4">
          <span className="h-px w-10 bg-honey" />
          <p className="font-editorial text-heading-sm">{t('cart.empty')}</p>
          <p className="max-w-sm text-body-sm text-stone">{t('cart.emptyHint')}</p>
          <Button asChild className="mt-2">
            <Link to="/catalog">{t('cart.goToCatalog')}</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <section className="band-snow pb-40 pt-14 lg:pb-24">
      <div className="container-page">
        <p className="eyebrow gold-rule text-stone">{t('cart.checkout')}</p>
        <h1 className="font-editorial mt-4 text-display">{t('checkout.title')}</h1>
        <p className="mt-4 max-w-xl text-lead text-stone">{t('checkout.subtitle')}</p>
        {isDraftFilled(draft) && (
          <p className="mt-3 text-body-sm text-stone" data-testid="draft-note">
            {t('checkout.saved')}
          </p>
        )}

        <form
          id="checkout-form"
          onSubmit={handleSubmit}
          noValidate
          className="mt-14 grid gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20"
        >
          {/* min-w-0 не даёт длинной кнопке в сводке растянуть колонку сетки
              шире экрана — на телефоне из-за этого появлялся боковой скролл */}
          <div className="flex min-w-0 flex-col gap-8">
            <div className="grid gap-8 sm:grid-cols-2">
              <Field label={t('checkout.name')} error={errors.customerName}>
                <input
                  value={customerName}
                  onChange={(event) => setDraft({ customerName: event.target.value })}
                  placeholder={t('checkout.namePlaceholder')}
                  autoComplete="name"
                  data-testid="input-name"
                  className={inputClass}
                />
              </Field>

              <Field
                label={t('checkout.phone')}
                error={errors.phone}
                hint={t('checkout.phoneHint')}
              >
                {/* «+7» — надпись, а не текст поля: иначе человек, набирающий
                    «+7 707…» руками, отправляет код страны внутрь номера
                    и весь номер съезжает на разряд. */}
                <span
                  className={cn(
                    inputClass,
                    // Подсветку линии берёт на себя обёртка: фокус теперь у вложенного поля
                    'flex items-center gap-2 focus:border-hairline-strong focus-within:border-teal',
                  )}
                >
                  <span aria-hidden className="shrink-0 text-body text-stone">
                    +7
                  </span>
                  <input
                    ref={phoneRef}
                    value={formatKzNational(phoneDigits)}
                    onChange={(event) => onPhoneChange(event.target.value)}
                    placeholder={t('checkout.phonePlaceholder')}
                    autoComplete="tel-national"
                    inputMode="numeric"
                    // maxLength не ставим: одиннадцатая цифра нужна разборщику,
                    // чтобы понять, что первая была кодом страны, и сдвинуть номер.
                    // Лишнее он всё равно отрежет сам.
                    data-testid="input-phone"
                    className="w-full min-w-0 bg-transparent text-body text-mountain outline-none placeholder:text-stone-light"
                  />
                </span>
              </Field>
            </div>

            <Choice
              label={t('checkout.customerType')}
              value={customerType}
              onChange={(value) => setDraft({ customerType: value })}
              options={[
                { value: 'PERSON', label: t('checkout.person') },
                { value: 'BUSINESS', label: t('checkout.business') },
              ]}
            />

            <Choice
              label={t('checkout.deliveryType')}
              value={deliveryType}
              onChange={(value) => setDraft({ deliveryType: value })}
              options={[
                { value: 'DELIVERY', label: t('checkout.delivery') },
                { value: 'PICKUP', label: t('checkout.pickup') },
              ]}
            />

            {deliveryType === 'DELIVERY' ? (
              <Field label={t('checkout.address')} error={errors.address}>
                <input
                  value={address}
                  onChange={(event) => setDraft({ address: event.target.value })}
                  placeholder={t('checkout.addressPlaceholder')}
                  autoComplete="street-address"
                  data-testid="input-address"
                  className={inputClass}
                />
              </Field>
            ) : (
              settings && (
                <p className="border-l border-hairline pl-5 text-body-sm text-stone">
                  {pick(settings.delivery.pickupAddress, locale)}
                </p>
              )
            )}

            <Choice
              label={t('checkout.channel')}
              value={channel}
              onChange={(value) => setDraft({ channel: value })}
              options={[
                { value: 'WHATSAPP', label: t('checkout.whatsapp') },
                { value: 'TELEGRAM', label: t('checkout.telegram') },
              ]}
            />

            <Field label={t('checkout.comment')}>
              <textarea
                value={comment}
                onChange={(event) => setDraft({ comment: event.target.value })}
                placeholder={t('checkout.commentPlaceholder')}
                rows={3}
                className={cn(inputClass, 'resize-none')}
              />
            </Field>

            {/* Ловушка для ботов: скрыта от людей и от скринридеров */}
            <input
              type="text"
              name="website"
              value={honeypot}
              onChange={(event) => setHoneypot(event.target.value)}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden
              className="pointer-events-none absolute h-0 w-0 opacity-0"
            />
          </div>

          {/* Сводка заказа — липкая, чтобы итог был виден при заполнении формы */}
          <aside className="h-fit min-w-0 border border-hairline bg-parchment p-6 lg:sticky lg:top-24">
            <p className="eyebrow text-stone">{t('cart.title')}</p>

            <ul className="mt-5 flex flex-col gap-4 border-b border-hairline pb-5">
              {items.map(({ product, qty }) => (
                <li key={product.id} className="flex items-center gap-3">
                  <ProductMedia
                    image={product.image}
                    name={pick(product.name, locale)}
                    className="h-14 w-12 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-body-sm font-semibold">
                      {pick(product.name, locale)}
                    </p>
                    <p className="text-caption uppercase tracking-[0.125em] text-stone">
                      {formatWeight(product.weight, locale)} × {qty}
                    </p>
                  </div>
                  <span className="text-body-sm tabular-nums">
                    {formatPrice(product.price * qty, locale)}
                  </span>
                  {/* Передумал по одной позиции — можно убрать прямо здесь,
                      не возвращаясь в корзину */}
                  <button
                    type="button"
                    onClick={() => removeItem(product.id)}
                    aria-label={t('cart.removeItem', { name: pick(product.name, locale) })}
                    data-testid={`checkout-remove-${product.slug}`}
                    className="-mr-1 grid h-8 w-8 shrink-0 place-items-center rounded-pill text-stone transition-colors hover:bg-snow hover:text-mountain"
                  >
                    <Trash2 size={14} strokeWidth={1.5} />
                  </button>
                </li>
              ))}
            </ul>

            <dl className="mt-5 flex flex-col gap-2 text-body-sm">
              <div className="flex justify-between">
                <dt className="text-stone">{t('cart.subtotal')}</dt>
                <dd className="tabular-nums">{formatPrice(subtotal, locale)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-stone">{t('cart.delivery')}</dt>
                <dd className="tabular-nums">
                  {deliveryFee === 0 ? t('cart.deliveryFree') : formatPrice(deliveryFee, locale)}
                </dd>
              </div>
              <div className="mt-3 flex items-baseline justify-between border-t border-hairline pt-4">
                <dt className="eyebrow text-stone">{t('cart.total')}</dt>
                <dd className="font-editorial text-heading-sm tabular-nums" data-testid="checkout-total">
                  {formatPrice(subtotal + deliveryFee, locale)}
                </dd>
              </div>
            </dl>

            {mutation.isError && (
              <p className="mt-5 border-l-2 border-[#b23b3b] pl-4 text-body-sm text-[#b23b3b]">
                {mutation.error instanceof ApiError
                  ? mutation.error.message
                  : t('common.error')}
              </p>
            )}

            <Button
              type="submit"
              variant="solid"
              size="lg"
              disabled={mutation.isPending}
              data-testid="submit-order-desktop"
              className="mt-6 hidden w-full whitespace-normal lg:inline-flex"
            >
              {mutation.isPending ? t('checkout.submitting') : t('checkout.submit')}
            </Button>

            {/* Оплата не сюрприз: показываем заранее, что после оформления
                откроется Kaspi, если способ включён в кабинете. */}
            {settings?.payment.kaspiEnabled && settings.payment.kaspiLink && (
              <p className="mt-5 flex items-start gap-2 border-t border-hairline pt-4 text-body-sm text-mountain/80">
                <CreditCard size={16} strokeWidth={1.5} className="mt-0.5 shrink-0 text-honey" />
                {t('payment.onCheckout')}
              </p>
            )}

            <p className="mt-4 text-caption leading-relaxed text-stone">
              {t('checkout.agreement')}
            </p>
          </aside>
        </form>
      </div>

      {/* На телефоне итог и кнопка всегда под рукой: иначе после длинной формы
          до них нужно долго скроллить, и часть заказов теряется на этом шаге. */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-hairline bg-snow/95 px-[var(--spacing-gutter)] py-3 backdrop-blur-md lg:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-0">
            <p className="text-caption uppercase tracking-[0.125em] text-stone">
              {t('cart.total')}
            </p>
            <p className="font-editorial text-heading-sm leading-tight tabular-nums">
              {formatPrice(subtotal + deliveryFee, locale)}
            </p>
          </div>

          <Button
            type="submit"
            form="checkout-form"
            variant="solid"
            size="lg"
            disabled={mutation.isPending}
            data-testid="submit-order"
            className="ml-auto min-w-0 flex-1 whitespace-normal px-4 text-center leading-tight"
          >
            {mutation.isPending ? t('checkout.submitting') : t('checkout.submit')}
          </Button>
        </div>
      </div>
    </section>
  );
};
