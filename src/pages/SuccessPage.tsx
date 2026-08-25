import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { Check, Copy, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useLocale } from '@/hooks/useLocale';
import type { CreatedOrder } from '@/types/catalog';

type State = { order: CreatedOrder; channel: 'WHATSAPP' | 'TELEGRAM' } | null;

export const SuccessPage = () => {
  const { t } = useLocale();
  const state = (useLocation().state ?? null) as State;
  const [copied, setCopied] = useState(false);

  // Открываем чат сами: пользователь уже нажал «оформить», ждать второго клика незачем.
  // Всплывающее окно может быть заблокировано — поэтому кнопка на странице остаётся.
  useEffect(() => {
    if (!state?.order) return;
    const timer = window.setTimeout(() => {
      window.open(state.order.chatUrl, '_blank', 'noopener');
    }, 900);
    return () => window.clearTimeout(timer);
  }, [state]);

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
