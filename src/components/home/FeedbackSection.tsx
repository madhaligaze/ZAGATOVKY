import { useEffect, useState, type FormEvent } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useMutation } from '@tanstack/react-query';
import { Check, MessageSquarePlus, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useReveal } from '@/hooks/useReveal';
import { useLocale } from '@/hooks/useLocale';
import { api } from '@/lib/api';
import { cn } from '@/lib/cn';
import type { FeedbackInput } from '@/types/catalog';

type Kind = FeedbackInput['kind'];

const kinds = ['WISH', 'REVIEW', 'QUESTION'] as const satisfies readonly NonNullable<Kind>[];

const inputClass =
  'w-full border-b border-hairline-strong bg-transparent py-3 text-body text-mountain outline-none transition-colors placeholder:text-stone-light focus:border-teal';

/**
 * Приглашение написать нам — стоит перед блоком «Частые вопросы»: человек уже
 * прочитал про товары и доставку, и если ответа на свой вопрос не нашёл,
 * ему тут же есть куда его задать.
 */
export const FeedbackSection = () => {
  const { t, locale } = useLocale();
  const ref = useReveal<HTMLElement>();

  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<NonNullable<Kind>>('WISH');
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [message, setMessage] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const mutation = useMutation({ mutationFn: api.sendFeedback });

  /*
   * Чистим форму при открытии, а не при закрытии.
   *
   * Так уходящее окно до конца показывает «спасибо», а любое следующее открытие —
   * хоть сразу, хоть через час — начинается с пустой формы. Сброс по таймеру
   * после закрытия этого не давал: успеешь открыть быстрее — увидишь прошлый
   * экран благодарности вместо полей.
   */
  useEffect(() => {
    if (!open) return;
    mutation.reset();
    setName('');
    setContact('');
    setMessage('');
    setKind('WISH');
    setErrors({});
    // mutation пересоздаётся каждый рендер — следим только за открытием
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const placeholders: Record<NonNullable<Kind>, string> = {
    WISH: t('feedback.messagePlaceholderWish'),
    REVIEW: t('feedback.messagePlaceholderReview'),
    QUESTION: t('feedback.messagePlaceholderQuestion'),
  };

  const labels: Record<NonNullable<Kind>, string> = {
    WISH: t('feedback.kindWish'),
    REVIEW: t('feedback.kindReview'),
    QUESTION: t('feedback.kindQuestion'),
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();

    const next: Record<string, string> = {};
    if (name.trim().length < 2) next.name = t('feedback.errors.name');
    if (message.trim().length < 5) next.message = t('feedback.errors.message');

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    mutation.mutate({
      kind,
      name: name.trim(),
      contact: contact.trim() || undefined,
      message: message.trim(),
      locale,
      website: honeypot,
      // Прогоны Playwright помечают свои сообщения, чтобы они не смешивались
      // с настоящими в кабинете — так же, как заказы.
      isTest: Boolean((window as unknown as { __ZG_E2E__?: boolean }).__ZG_E2E__),
    });
  };

  return (
    <section ref={ref} className="band band-parchment" data-testid="feedback-section">
      <div className="container-page">
        <div className="reveal flex flex-col items-center gap-6 border border-hairline bg-snow px-6 py-14 text-center sm:px-12">
          <span className="grid h-14 w-14 place-items-center rounded-pill border border-honey text-honey">
            <MessageSquarePlus size={24} strokeWidth={1.5} />
          </span>

          <p className="eyebrow text-stone">{t('feedback.eyebrow')}</p>
          <h2 className="font-editorial max-w-2xl text-heading-lg leading-[1.1]">
            {t('feedback.title')}
          </h2>
          <p className="max-w-xl text-lead text-stone">{t('feedback.subtitle')}</p>

          <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger asChild>
              <Button variant="solid" size="lg" className="mt-2" data-testid="feedback-open">
                {t('feedback.open')}
              </Button>
            </Dialog.Trigger>

            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-60 bg-mountain/40 backdrop-blur-[2px] data-[state=open]:animate-[fade-in_200ms_ease-out]" />
              <Dialog.Content
                data-testid="feedback-dialog"
                className="fixed left-1/2 top-1/2 z-60 flex max-h-[92dvh] w-[min(34rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-y-auto border border-hairline bg-snow text-left data-[state=open]:animate-[fade-in_220ms_ease-out]"
              >
                <div className="flex items-start justify-between gap-4 border-b border-hairline px-6 py-5">
                  <div className="min-w-0">
                    <Dialog.Title className="font-editorial text-heading-sm">
                      {mutation.isSuccess ? t('feedback.doneTitle') : t('feedback.dialogTitle')}
                    </Dialog.Title>
                    <Dialog.Description className="mt-1 text-body-sm text-stone">
                      {mutation.isSuccess ? t('feedback.doneText') : t('feedback.dialogSubtitle')}
                    </Dialog.Description>
                  </div>
                  <Dialog.Close
                    aria-label={t('feedback.close')}
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-pill border border-hairline hover:bg-parchment"
                  >
                    <X size={18} strokeWidth={1.5} />
                  </Dialog.Close>
                </div>

                {mutation.isSuccess ? (
                  <div
                    className="flex flex-col items-center gap-5 px-6 py-12 text-center"
                    data-testid="feedback-done"
                  >
                    <span className="grid h-14 w-14 place-items-center rounded-pill border border-honey text-honey">
                      <Check size={24} strokeWidth={1.5} />
                    </span>
                    <Button variant="solid" onClick={() => setOpen(false)}>
                      {t('feedback.close')}
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={submit} noValidate className="flex flex-col gap-6 px-6 py-6">
                    <fieldset>
                      <legend className="eyebrow mb-3 text-stone">{t('feedback.kind')}</legend>
                      <div className="flex flex-wrap gap-2">
                        {kinds.map((value) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setKind(value)}
                            aria-pressed={kind === value}
                            data-testid={`feedback-kind-${value}`}
                            className={cn(
                              'rounded-pill border px-5 py-2.5 text-caption uppercase tracking-[0.125em] transition-colors',
                              kind === value
                                ? 'border-mountain bg-mountain text-parchment'
                                : 'border-hairline text-mountain hover:border-teal hover:bg-parchment',
                            )}
                          >
                            {labels[value]}
                          </button>
                        ))}
                      </div>
                    </fieldset>

                    <label className="flex flex-col gap-2">
                      <span className="eyebrow text-stone">{t('feedback.name')}</span>
                      <input
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        placeholder={t('feedback.namePlaceholder')}
                        autoComplete="name"
                        data-testid="feedback-name"
                        className={inputClass}
                      />
                      <span className="min-h-5 text-body-sm leading-5 text-[#b23b3b]">
                        {errors.name ?? ''}
                      </span>
                    </label>

                    <label className="flex flex-col gap-2">
                      <span className="eyebrow text-stone">{t('feedback.contact')}</span>
                      <input
                        value={contact}
                        onChange={(event) => setContact(event.target.value)}
                        placeholder={t('feedback.contactPlaceholder')}
                        data-testid="feedback-contact"
                        className={inputClass}
                      />
                      <span className="min-h-5 text-body-sm leading-5 text-stone">
                        {t('feedback.contactHint')}
                      </span>
                    </label>

                    <label className="flex flex-col gap-2">
                      <span className="eyebrow text-stone">{t('feedback.message')}</span>
                      <textarea
                        value={message}
                        onChange={(event) => setMessage(event.target.value)}
                        placeholder={placeholders[kind]}
                        rows={4}
                        data-testid="feedback-message"
                        className={cn(inputClass, 'resize-none')}
                      />
                      <span className="min-h-5 text-body-sm leading-5 text-[#b23b3b]">
                        {errors.message ?? ''}
                      </span>
                    </label>

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

                    {mutation.isError && (
                      <p className="border-l-2 border-[#b23b3b] pl-4 text-body-sm text-[#b23b3b]">
                        {mutation.error.message}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-3">
                      <Button
                        type="submit"
                        variant="solid"
                        disabled={mutation.isPending}
                        data-testid="feedback-submit"
                      >
                        {mutation.isPending ? t('feedback.submitting') : t('feedback.submit')}
                      </Button>
                      <Dialog.Close asChild>
                        <Button type="button" variant="quiet">
                          {t('feedback.cancel')}
                        </Button>
                      </Dialog.Close>
                    </div>
                  </form>
                )}
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </div>
    </section>
  );
};
