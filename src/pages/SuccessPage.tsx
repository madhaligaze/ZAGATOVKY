import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { Check, Copy, CreditCard, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useLocale } from '@/hooks/useLocale';
import { usePublicSettings } from '@/hooks/usePublicSettings';
import { formatPrice, pick } from '@/lib/format';
import type { CreatedOrder } from '@/types/catalog';

type State = { order: CreatedOrder; channel: 'WHATSAPP' | 'TELEGRAM' } | null;

/*
 * Подтверждение жило только в state роутера, поэтому F5 на этой странице (или
 * возврат по ссылке из истории) уводил на главную: номер заказа, готовый текст
 * для чата и ссылка на оплату пропадали, хотя сам заказ уже лежал в базе.
 * Дублируем последнее подтверждение в sessionStorage — оно привязано к вкладке
 * и само исчезает, когда её закрывают.
 */
const LAST_ORDER_KEY = 'zagatovky:last-order';

const remember = (state: NonNullable<State>) => {
  try {
    sessionStorage.setItem(LAST_ORDER_KEY, JSON.stringify(state));
  } catch {
    // Приватный режим может запретить запись — тогда просто работаем как раньше
  }
};

const recall = (): State => {
  try {
    const raw = sessionStorage.getItem(LAST_ORDER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as State;
    return parsed?.order?.number ? parsed : null;
  } catch {
    return null;
  }
};

export const SuccessPage = () => {
  const { t, locale } = useLocale();
  const { data: settings } = usePublicSettings();
  const routerState = (useLocation().state ?? null) as State;
  // Первый рендер после оформления берёт данные из роутера, перезагрузка — из
  // sessionStorage. Читаем один раз, чтобы вкладка не переигрывала автооткрытие
  // чата на каждый повторный рендер.
  const [state] = useState<State>(() => {
    if (routerState?.order) {
      remember(routerState);
      return routerState;
    }
    return recall();
  });
  const [copied, setCopied] = useState(false);

  // Открываем чат сами: пользователь уже нажал «оформить», ждать второго клика незачем.
  // Всплывающее окно может быть заблокировано — поэтому кнопка на странице остаётся.
  // Только для только что оформленного заказа: после F5 страница
  // восстанавливается из sessionStorage, и открывать чат заново незачем —
  // человек уже там был и вернулся сюда сознательно.
  useEffect(() => {
    if (!routerState?.order) return;
    const timer = window.setTimeout(() => {
      window.open(routerState.order.chatUrl, '_blank', 'noopener');
    }, 900);
    return () => window.clearTimeout(timer);
  }, [routerState]);

  if (!state?.order) return <Navigate to="/" replace />;

  const { order, channel } = state;
  const channelName = channel === 'TELEGRAM' ? 'Telegram' : 'WhatsApp';

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(order.message);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Буфер недоступен — текст всё равно виден на странице и его можно выделить
    }
  };

  return (
    <section className="band-snow pb-24 pt-20">
      <div className="container-page max-w-2xl text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-pill border border-honey text-honey">
          <Check size={24} strokeWidth={1.5} />
        </span>

        <h1 className="font-editorial mt-8 text-display" data-testid="order-number">
          {t('success.title', { number: order.number })}
        </h1>
        <p className="mt-4 text-lead text-stone">{t('success.subtitle')}</p>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Button asChild variant="solid" size="lg">
            <a href={order.chatUrl} target="_blank" rel="noreferrer" data-testid="open-chat">
              <MessageCircle size={18} strokeWidth={1.5} />
              {t('success.openChat', { channel: channelName })}
            </a>
          </Button>
          <Button size="lg" onClick={() => void copy()}>
            <Copy size={16} strokeWidth={1.5} />
            {copied ? t('success.copied') : t('success.copy')}
          </Button>
        </div>

        {/* Оплата по ссылке Kaspi Pay. Ссылка привязана к торговой точке и не знает
            сумму заказа, поэтому сумму и номер выводим крупно рядом — их вводит
            сам клиент в приложении. Способ включается в настройках кабинета. */}
        {order.paymentUrl && (
          <div className="mt-10 border border-hairline bg-parchment p-6">
            <p className="eyebrow gold-rule text-stone">{t('payment.title')}</p>

            <p className="mt-4 text-caption uppercase tracking-[0.125em] text-stone">
              {t('payment.amount')}
            </p>
            <p className="font-editorial text-display leading-none" data-testid="payment-amount">
              {formatPrice(order.total, locale)}
            </p>

            {settings?.payment.kaspiAmountManual && (
              <p className="mt-4 text-body-sm text-mountain/80">
                {t('payment.manualAmount', {
                  amount: formatPrice(order.total, locale),
                  number: order.number,
                })}
              </p>
            )}

            <Button asChild variant="solid" size="lg" className="mt-6 w-full sm:w-auto">
              <a
                href={order.paymentUrl}
                target="_blank"
                rel="noreferrer"
                data-testid="pay-kaspi"
              >
                <CreditCard size={18} strokeWidth={1.5} />
                {t('payment.kaspi')}
              </a>
            </Button>

            {/* Своё примечание из настроек вытесняет общую фразу, а не приписывается
                к ней: иначе на странице оказывались две подписи об одном и том же. */}
            <p className="mt-4 text-caption leading-relaxed text-stone">
              {settings?.payment.note && pick(settings.payment.note, locale)
                ? pick(settings.payment.note, locale)
                : t('payment.afterConfirm')}
            </p>
          </div>
        )}

        <pre className="mt-12 whitespace-pre-wrap border border-hairline bg-parchment p-6 text-left font-sans text-body-sm leading-relaxed text-mountain/80">
          {order.message}
        </pre>

        <p className="mt-6 text-body-sm text-stone">{t('success.note')}</p>

        <Link
          to="/catalog"
          className="mt-10 inline-block text-caption uppercase tracking-[0.125em] text-stone underline-offset-4 hover:text-mountain hover:underline"
        >
          {t('success.toCatalog')}
        </Link>
      </div>
    </section>
  );
};
