import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Archive,
  ArchiveRestore,
  Lightbulb,
  Mail,
  MailOpen,
  MessageCircle,
  MessageSquareQuote,
  Phone,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { api, keys, type Feedback, type FeedbackKind } from '@/lib/api';
import { Button, Chip, EmptyState, Input, Panel, Spinner } from '@/components/ui';
import { dateTime, relative } from '@/lib/format';
import { cn } from '@/lib/cn';

const kindLabels: Record<FeedbackKind, string> = {
  WISH: 'Хочет продукт',
  REVIEW: 'Отзыв',
  QUESTION: 'Вопрос',
};

const kindIcons: Record<FeedbackKind, typeof Lightbulb> = {
  WISH: Lightbulb,
  REVIEW: MessageSquareQuote,
  QUESTION: MessageCircle,
};

const kindTones: Record<FeedbackKind, 'accent' | 'success' | 'neutral'> = {
  WISH: 'accent',
  REVIEW: 'success',
  QUESTION: 'neutral',
};

const Card = ({
  item,
  onToggleRead,
  onToggleArchive,
}: {
  item: Feedback;
  onToggleRead: (item: Feedback) => void;
  onToggleArchive: (item: Feedback) => void;
}) => {
  const Icon = kindIcons[item.kind];
  const archived = Boolean(item.archivedAt);

  return (
    <article
      data-testid={`feedback-${item.id}`}
      className={cn(
        'flex flex-col gap-3 rounded-control border bg-surface p-3',
        // Непрочитанное видно с одного взгляда: акцентная рамка и полоса слева
        item.isRead ? 'border-line' : 'border-accent border-l-4',
        archived && 'opacity-70',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{item.name}</p>
          <p className="text-2xs text-faint">
            {relative(item.createdAt)} · {dateTime(item.createdAt)}
          </p>
        </div>
        <Icon size={16} className="shrink-0 text-faint" />
      </div>

      <div className="flex flex-wrap gap-1">
        {!item.isRead && <Chip tone="accent">Новое</Chip>}
        {archived && <Chip>В архиве</Chip>}
        <Chip tone={kindTones[item.kind]}>{kindLabels[item.kind]}</Chip>
        {item.locale === 'kk' && <Chip>Қазақша</Chip>}
        {item.isTest && <Chip tone="warning">Тест</Chip>}
      </div>

      <p className="whitespace-pre-wrap rounded border-l-2 border-line pl-3 text-sm leading-relaxed">
        {item.message}
      </p>

      {item.contact ? (
        <p className="text-2xs text-muted">Контакт: {item.contact}</p>
      ) : (
        <p className="text-2xs text-faint">Контакт не оставлен — ответить не получится</p>
      )}

      <div className="flex flex-wrap gap-1.5">
        {item.replyUrl && (
          <Button asChild size="sm" variant="primary" className="min-w-0 flex-1">
            <a href={item.replyUrl} target="_blank" rel="noreferrer">
              <MessageCircle size={13} /> Ответить
            </a>
          </Button>
        )}

        {item.contact && !item.replyUrl && (
          <Button asChild size="sm" variant="outline" className="min-w-0 flex-1">
            <a href={`tel:${item.contact.replace(/\s/g, '')}`}>
              <Phone size={13} /> {item.contact}
            </a>
          </Button>
        )}

        <Button
          size="sm"
          variant={item.isRead ? 'outline' : 'primary'}
          title={item.isRead ? 'Пометить непрочитанным' : 'Пометить прочитанным'}
          aria-label={item.isRead ? 'Пометить непрочитанным' : 'Пометить прочитанным'}
          data-testid={`feedback-read-${item.id}`}
          className={cn(!item.replyUrl && !item.contact && 'min-w-0 flex-1')}
          onClick={() => onToggleRead(item)}
        >
          {item.isRead ? <Mail size={13} /> : <MailOpen size={13} />}
          {!item.replyUrl && !item.contact && (item.isRead ? 'Непрочитано' : 'Прочитано')}
        </Button>

        <Button
          size="sm"
          variant="outline"
          title={archived ? 'Вернуть из архива' : 'В архив — сообщение скроется, но не удалится'}
          aria-label={archived ? 'Вернуть из архива' : 'В архив'}
          data-testid={`feedback-archive-${item.id}`}
          onClick={() => onToggleArchive(item)}
        >
          {archived ? <ArchiveRestore size={13} /> : <Archive size={13} />}
        </Button>
      </div>
    </article>
  );
};

export const FeedbackPage = () => {
  const [params, setParams] = useSearchParams();
  const queryClient = useQueryClient();

  const search = params.get('search') ?? '';
  const kind = params.get('kind') ?? '';
  const unreadOnly = params.get('unread') === '1';
  const includeTest = params.get('test') === '1';
  const archived = params.get('archived') === '1';

  const query = { search, kind, unreadOnly, includeTest, archived };
  const { data, isPending } = useQuery({
    queryKey: keys.feedback(query),
    queryFn: () =>
      api.feedback({
        search,
        kind: kind || undefined,
        read: unreadOnly ? 'no' : undefined,
        includeTest,
        archived: archived ? 'only' : 'no',
        limit: 200,
      }),
    refetchInterval: 60_000,
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['feedback'] });
    void queryClient.invalidateQueries({ queryKey: keys.feedbackUnread });
  };

  const setRead = useMutation({
    mutationFn: ({ id, isRead }: { id: string; isRead: boolean }) => api.setFeedbackRead(id, isRead),
    onSuccess: invalidate,
    onError: (error: Error) => toast.error(error.message),
  });

  const setArchived = useMutation({
    mutationFn: ({ id, value }: { id: string; value: boolean }) =>
      api.setFeedbackArchived(id, value),
    onSuccess: (item) => {
      invalidate();
      toast.success(
        item.archivedAt
          ? 'Сообщение в архиве — вернуть можно из вкладки «Архив»'
          : 'Сообщение возвращено',
      );
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const clearTest = useMutation({
    mutationFn: api.clearTestFeedback,
    onSuccess: (result) => {
      invalidate();
      toast.success(`Удалено тестовых сообщений: ${result.deleted}`);
    },
  });

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const items = data?.items ?? [];
  const unread = data?.unread ?? 0;

  const markAllRead = () => {
    const pending = items.filter((item) => !item.isRead);
    // Массовой ручки нет намеренно: сообщений мало, а отдельные запросы
    // переиспользуют уже готовый эндпоинт и не требуют новой сущности в API.
    pending.forEach((item) => setRead.mutate({ id: item.id, isRead: true }));
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">
            {archived ? 'Архив сообщений' : 'Отзывы и пожелания'}
          </h1>
          <p className="text-2xs text-muted">
            {archived
              ? 'Сообщения убраны из работы, но их можно вернуть'
              : 'Что пишут с витрины: пожелания по ассортименту, отзывы и вопросы'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={search}
            onChange={(event) => setParam('search', event.target.value)}
            placeholder="Имя, текст или контакт"
            className="w-full sm:w-52"
          />

          <Button
            size="sm"
            variant={unreadOnly ? 'primary' : 'outline'}
            onClick={() => setParam('unread', unreadOnly ? '' : '1')}
            data-testid="filter-unread"
          >
            Непрочитанные{unread > 0 && ` · ${unread}`}
          </Button>

          <Button
            size="sm"
            variant={archived ? 'primary' : 'outline'}
            onClick={() => setParam('archived', archived ? '' : '1')}
            data-testid="filter-archived"
          >
            <Archive size={13} /> Архив
          </Button>

          <Button
            size="sm"
            variant={includeTest ? 'primary' : 'outline'}
            onClick={() => setParam('test', includeTest ? '' : '1')}
            title="Показать сообщения, созданные автотестами"
          >
            Тестовые
          </Button>

          {includeTest && (
            <Button size="sm" variant="danger" onClick={() => clearTest.mutate()}>
              <Trash2 size={13} /> Очистить тестовые
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {[{ value: '', label: 'Все' }, ...Object.entries(kindLabels).map(([value, label]) => ({ value, label }))].map(
          (chip) => (
            <Button
              key={chip.value || 'all'}
              size="sm"
              variant={kind === chip.value ? 'subtle' : 'ghost'}
              onClick={() => setParam('kind', chip.value)}
            >
              {chip.label}
            </Button>
          ),
        )}

        {items.some((item) => !item.isRead) && (
          <Button
            size="sm"
            variant="outline"
            className="ml-auto"
            onClick={markAllRead}
            data-testid="mark-all-read"
          >
            <MailOpen size={13} /> Отметить все прочитанными
          </Button>
        )}
      </div>

      {isPending ? (
        <Spinner />
      ) : items.length === 0 ? (
        <Panel>
          <EmptyState
            title={archived ? 'Архив пуст' : 'Сообщений пока нет'}
            hint={
              archived
                ? 'Сюда попадают сообщения, убранные кнопкой «В архив»'
                : 'Блок «Хотели бы видеть больше продуктов?» на главной ведёт сюда — как только кто-то напишет, сообщение появится здесь'
            }
          />
        </Panel>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <Card
              key={item.id}
              item={item}
              onToggleRead={(row) => setRead.mutate({ id: row.id, isRead: !row.isRead })}
              onToggleArchive={(row) =>
                setArchived.mutate({ id: row.id, value: !row.archivedAt })
              }
            />
          ))}
        </div>
      )}
    </div>
  );
};
