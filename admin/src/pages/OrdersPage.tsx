import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  PointerSensor,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  Archive,
  ArchiveRestore,
  LayoutGrid,
  MessageCircle,
  Phone,
  Rows3,
  Trash2,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';
import { api, keys, type AdminOrder, type OrderStatus } from '@/lib/api';
import { Button, Chip, EmptyState, Input, Panel, Select, Spinner } from '@/components/ui';
import { useIsWide } from '@/hooks/useMediaQuery';
import { dateTime, money, relative } from '@/lib/format';
import { cn } from '@/lib/cn';

const columns: { status: OrderStatus; label: string }[] = [
  { status: 'NEW', label: 'Новые' },
  { status: 'CONFIRMED', label: 'Подтверждены' },
  { status: 'COOKING', label: 'Готовим' },
  { status: 'DELIVERING', label: 'В пути' },
  { status: 'DONE', label: 'Доставлены' },
  { status: 'CANCELLED', label: 'Отменены' },
];

type CardActions = {
  onTogglePaid: (order: AdminOrder) => void;
  onSetStatus: (order: AdminOrder, status: OrderStatus) => void;
  onToggleArchive: (order: AdminOrder) => void;
};

const OrderCard = ({
  order,
  draggable = true,
  highlighted = false,
  /** В канбане колонка сама говорит о статусе — селектор там был бы дублем */
  withStatus = false,
  actions,
}: {
  order: AdminOrder;
  draggable?: boolean;
  highlighted?: boolean;
  withStatus?: boolean;
  actions: CardActions;
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: order.id,
    disabled: !draggable,
  });

  const archived = Boolean(order.archivedAt);

  return (
    <article
      ref={setNodeRef}
      style={transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined}
      className={cn(
        'rounded-control border border-line bg-surface p-3 transition-shadow',
        isDragging && 'z-20 shadow-lg',
        highlighted && 'border-accent ring-1 ring-accent',
        archived && 'opacity-70',
      )}
      data-testid={`order-${order.number}`}
    >
      <div
        {...attributes}
        {...listeners}
        className={cn('flex items-start justify-between gap-2', draggable && 'cursor-grab active:cursor-grabbing')}
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{order.customerName}</p>
          <p className="text-2xs text-faint">
            {order.number} · {relative(order.createdAt)}
          </p>
        </div>
        <span className="shrink-0 text-sm font-semibold tabular-nums">{money(order.total)}</span>
      </div>

      <div className="mt-2 flex flex-wrap gap-1">
        {archived && <Chip tone="neutral">В архиве</Chip>}
        {order.isPaid ? (
          <Chip tone="success" title={order.paidAt ? `Оплачен ${dateTime(order.paidAt)}` : undefined}>
            Оплачен
          </Chip>
        ) : (
          <Chip tone="warning">Не оплачен</Chip>
        )}
        {order.isTest && <Chip tone="warning">Тест</Chip>}
        {order.customerType === 'BUSINESS' && <Chip tone="accent">Заведение</Chip>}
        <Chip>{order.deliveryType === 'PICKUP' ? 'Самовывоз' : 'Доставка'}</Chip>
        <Chip>{order.itemsCount} шт</Chip>
      </div>

      <ul className="mt-2 flex flex-col gap-0.5 text-2xs text-muted">
        {order.items.slice(0, 3).map((item) => (
          <li key={item.id} className="truncate">
            {item.nameRu} × {item.qty}
          </li>
        ))}
        {order.items.length > 3 && <li className="text-faint">и ещё {order.items.length - 3}…</li>}
      </ul>

      {order.address && <p className="mt-2 text-2xs text-muted">{order.address}</p>}
      {order.comment && (
        <p className="mt-1 rounded border-l-2 border-accent pl-2 text-2xs italic text-muted">
          {order.comment}
        </p>
      )}

      {/* Списком статус меняют выбором, а не перетаскиванием: на телефоне
          drag & drop через шесть колонок физически не работает. */}
      {withStatus && (
        <Select
          value={order.status}
          onChange={(event) => actions.onSetStatus(order, event.target.value as OrderStatus)}
          aria-label={`Статус заказа ${order.number}`}
          data-testid={`status-${order.number}`}
          className="mt-3 h-8 text-2xs"
        >
          {columns.map((column) => (
            <option key={column.status} value={column.status}>
              {column.label}
            </option>
          ))}
        </Select>
      )}

      <div className="mt-2 flex gap-1.5">
        <Button asChild size="sm" variant="primary" className="min-w-0 flex-1">
          <a href={order.chatUrl} target="_blank" rel="noreferrer">
            <MessageCircle size={13} /> Написать
          </a>
        </Button>
        <Button
          size="sm"
          variant={order.isPaid ? 'subtle' : 'outline'}
          title={order.isPaid ? 'Снять отметку об оплате' : 'Отметить оплаченным'}
          aria-label={order.isPaid ? 'Снять отметку об оплате' : 'Отметить оплаченным'}
          onClick={() => actions.onTogglePaid(order)}
        >
          <Wallet size={13} />
        </Button>
        <Button asChild size="sm" variant="outline" title={order.phone} aria-label="Позвонить">
          <a href={`tel:${order.phone.replace(/\s/g, '')}`}>
            <Phone size={13} />
          </a>
        </Button>
        <Button
          size="sm"
          variant="outline"
          title={archived ? 'Вернуть из архива' : 'В архив — заказ скроется, но не удалится'}
          aria-label={archived ? 'Вернуть из архива' : 'В архив'}
          data-testid={`archive-${order.number}`}
          onClick={() => actions.onToggleArchive(order)}
        >
          {archived ? <ArchiveRestore size={13} /> : <Archive size={13} />}
        </Button>
      </div>
    </article>
  );
};

const Column = ({
  status,
  label,
  orders,
  actions,
}: {
  status: OrderStatus;
  label: string;
  orders: AdminOrder[];
  actions: CardActions;
}) => {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const sum = orders.reduce((total, order) => total + order.total, 0);

  return (
    <div
      ref={setNodeRef}
      data-testid={`column-${status}`}
      className={cn(
        'flex w-72 shrink-0 flex-col rounded-panel border bg-canvas transition-colors',
        isOver ? 'border-accent bg-accent-soft' : 'border-line',
      )}
    >
      <header className="flex items-center justify-between gap-2 border-b border-line px-3 py-2">
        <h2 className="label-caps">{label}</h2>
        <span className="text-2xs tabular-nums text-faint">
          {orders.length}
          {sum > 0 && ` · ${money(sum)}`}
        </span>
      </header>

      <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-2">
        {orders.length === 0 ? (
          <p className="py-8 text-center text-2xs text-faint">Пусто</p>
        ) : (
          orders.map((order) => <OrderCard key={order.id} order={order} actions={actions} />)
        )}
      </div>
    </div>
  );
};

export const OrdersPage = () => {
  const [params, setParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<'board' | 'list'>('board');
  // Канбан включаем только там, где он помещается: на телефоне шесть колонок
  // по 288px пришлось бы листать вбок, а карточку — тащить пальцем между ними.
  const wide = useIsWide();
  const board = wide && mode === 'board';

  const focusId = params.get('focus');
  const search = params.get('search') ?? '';
  const includeTest = params.get('test') === '1';
  const paid = params.get('paid') ?? '';
  const archived = params.get('archived') === '1';

  const query = { search, includeTest, paid, archived };
  const { data, isPending } = useQuery({
    queryKey: keys.orders(query),
    queryFn: () =>
      api.orders({
        search,
        includeTest,
        paid: paid || undefined,
        archived: archived ? 'only' : 'no',
        limit: 200,
      }),
    refetchInterval: 30_000,
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['orders'] });
    void queryClient.invalidateQueries({ queryKey: keys.stats });
    void queryClient.invalidateQueries({ queryKey: ['finance'] });
  };

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      api.setOrderStatus(id, { status }),
    onSuccess: invalidate,
    onError: (error: Error) => toast.error(error.message),
  });

  // Kaspi не сообщает сайту об оплате по ссылке, поэтому отметку ставит человек.
  // Тот же эндпоинт потом будет дёргать callback эквайринга — см. PAYMENTS.md.
  const setPaid = useMutation({
    mutationFn: ({ id, isPaid }: { id: string; isPaid: boolean }) => api.setOrderPaid(id, isPaid),
    onSuccess: (order) => {
      invalidate();
      toast.success(order.isPaid ? 'Заказ отмечен оплаченным' : 'Отметка об оплате снята');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  /** Архив вместо удаления: заказ уходит из работы, но его можно вернуть. */
  const setArchived = useMutation({
    mutationFn: ({ id, value }: { id: string; value: boolean }) => api.setOrderArchived(id, value),
    onSuccess: (order) => {
      invalidate();
      toast.success(
        order.archivedAt
          ? `${order.number} в архиве — вернуть можно из вкладки «Архив»`
          : `${order.number} возвращён в работу`,
      );
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const actions: CardActions = {
    onTogglePaid: (order) => setPaid.mutate({ id: order.id, isPaid: !order.isPaid }),
    onSetStatus: (order, status) =>
      order.status !== status && setStatus.mutate({ id: order.id, status }),
    onToggleArchive: (order) =>
      setArchived.mutate({ id: order.id, value: !order.archivedAt }),
  };

  const clearTest = useMutation({
    mutationFn: api.clearTestOrders,
    onSuccess: (result) => {
      invalidate();
      toast.success(`Удалено тестовых заявок: ${result.deleted}`);
    },
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const status = String(over.id) as OrderStatus;
    const order = data?.items.find((item) => item.id === active.id);
    if (!order || order.status === status) return;
    setStatus.mutate({ id: order.id, status });
  };

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const orders = data?.items ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">
            {archived ? 'Архив заказов' : 'Заказы'}
          </h1>
          <p className="text-2xs text-muted">
            {archived
              ? 'Заказы убраны из работы и не попадают в отчёты. Их можно вернуть.'
              : board
                ? 'Перетащите карточку в другую колонку, чтобы сменить статус'
                : 'Статус меняется выбором прямо в карточке'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={search}
            onChange={(event) => setParam('search', event.target.value)}
            placeholder="Имя, телефон или номер"
            className="w-full sm:w-52"
          />

          <Button
            size="sm"
            variant={archived ? 'primary' : 'outline'}
            onClick={() => setParam('archived', archived ? '' : '1')}
            title="Показать архив"
            data-testid="filter-archived"
          >
            <Archive size={13} /> Архив
          </Button>

          <Button
            size="sm"
            variant={paid === 'no' ? 'primary' : 'outline'}
            onClick={() => setParam('paid', paid === 'no' ? '' : 'no')}
            title="Показать только неоплаченные"
          >
            Не оплачены
          </Button>

          <Button
            size="sm"
            variant={includeTest ? 'primary' : 'outline'}
            onClick={() => setParam('test', includeTest ? '' : '1')}
            title="Показать заявки, созданные автотестами"
          >
            Тестовые
          </Button>

          {includeTest && (
            <Button size="sm" variant="danger" onClick={() => clearTest.mutate()}>
              <Trash2 size={13} /> Очистить тестовые
            </Button>
          )}

          {/* Переключатель режима только на широком экране: канбан из шести колонок
              по 288px на телефоне листался бы вбок и был бесполезен. */}
          {wide && (
          <div className="flex rounded-control border border-line p-0.5">
            <Button
              size="iconSm"
              variant={mode === 'board' ? 'subtle' : 'ghost'}
              onClick={() => setMode('board')}
              title="Канбан"
            >
              <LayoutGrid size={15} />
            </Button>
            <Button
              size="iconSm"
              variant={mode === 'list' ? 'subtle' : 'ghost'}
              onClick={() => setMode('list')}
              title="Списком"
            >
              <Rows3 size={15} />
            </Button>
          </div>
          )}
        </div>
      </div>

      {isPending ? (
        <Spinner />
      ) : orders.length === 0 ? (
        <Panel>
          <EmptyState
            title={archived ? 'Архив пуст' : 'Заявок пока нет'}
            hint={
              archived
                ? 'Сюда попадают заказы, убранные из работы кнопкой «В архив»'
                : 'Как только клиент оформит заказ на витрине, он появится здесь'
            }
          />
        </Panel>
      ) : (
        <>
          {board ? (
            <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragEnd={onDragEnd}>
              <div className="flex gap-3 overflow-x-auto pb-3">
                {columns.map((column) => (
                  <Column
                    key={column.status}
                    status={column.status}
                    label={column.label}
                    orders={orders.filter((order) => order.status === column.status)}
                    actions={actions}
                  />
                ))}
              </div>
            </DndContext>
          ) : (
            /* Списком — на телефоне всегда, на широком экране по выбору */
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {orders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  draggable={false}
                  withStatus
                  highlighted={order.id === focusId}
                  actions={actions}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
