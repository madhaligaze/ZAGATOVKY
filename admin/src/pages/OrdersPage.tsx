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
import { LayoutGrid, MessageCircle, Phone, Rows3, Trash2, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { api, keys, type AdminOrder, type OrderStatus } from '@/lib/api';
import { Button, Chip, EmptyState, Input, Panel, Spinner } from '@/components/ui';
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

const OrderCard = ({
  order,
  draggable = true,
  highlighted = false,
  onTogglePaid,
}: {
  order: AdminOrder;
  draggable?: boolean;
  highlighted?: boolean;
  onTogglePaid?: (order: AdminOrder) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: order.id,
    disabled: !draggable,
  });

  return (
    <article
      ref={setNodeRef}
      style={transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined}
      className={cn(
        'rounded-control border border-line bg-surface p-3 transition-shadow',
        isDragging && 'z-20 shadow-lg',
        highlighted && 'border-accent ring-1 ring-accent',
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

      <div className="mt-3 flex gap-1.5">
        <Button asChild size="sm" variant="primary" className="flex-1">
          <a href={order.chatUrl} target="_blank" rel="noreferrer">
            <MessageCircle size={13} /> Написать
          </a>
        </Button>
        <Button
          size="sm"
          variant={order.isPaid ? 'subtle' : 'outline'}
          title={order.isPaid ? 'Снять отметку об оплате' : 'Отметить оплаченным'}
          onClick={() => onTogglePaid?.(order)}
        >
          <Wallet size={13} />
        </Button>
        <Button asChild size="sm" variant="outline" title={order.phone}>
          <a href={`tel:${order.phone.replace(/\s/g, '')}`}>
            <Phone size={13} />
          </a>
        </Button>
      </div>
    </article>
  );
};

const Column = ({
  status,
  label,
  orders,
  onTogglePaid,
}: {
  status: OrderStatus;
  label: string;
  orders: AdminOrder[];
  onTogglePaid: (order: AdminOrder) => void;
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
          orders.map((order) => (
            <OrderCard key={order.id} order={order} onTogglePaid={onTogglePaid} />
          ))
        )}
      </div>
    </div>
  );
};

export const OrdersPage = () => {
  const [params, setParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<'board' | 'list'>('board');

  const focusId = params.get('focus');
  const search = params.get('search') ?? '';
  const includeTest = params.get('test') === '1';
  const paid = params.get('paid') ?? '';

  const { data, isPending } = useQuery({
    queryKey: keys.orders({ search, includeTest, paid }),
    queryFn: () => api.orders({ search, includeTest, paid: paid || undefined, limit: 200 }),
    refetchInterval: 30_000,
  });

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      api.setOrderStatus(id, { status }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['orders'] });
      void queryClient.invalidateQueries({ queryKey: keys.stats });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  // Kaspi не сообщает сайту об оплате по ссылке, поэтому отметку ставит человек.
  // Тот же эндпоинт потом будет дёргать callback эквайринга — см. PAYMENTS.md.
  const setPaid = useMutation({
    mutationFn: ({ id, isPaid }: { id: string; isPaid: boolean }) => api.setOrderPaid(id, isPaid),
    onSuccess: (order) => {
      void queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success(order.isPaid ? 'Заказ отмечен оплаченным' : 'Отметка об оплате снята');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const togglePaid = (order: AdminOrder) => setPaid.mutate({ id: order.id, isPaid: !order.isPaid });

  const clearTest = useMutation({
    mutationFn: api.clearTestOrders,
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: ['orders'] });
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Заказы</h1>
          <p className="text-2xs text-muted">
            Перетащите карточку в другую колонку, чтобы сменить статус
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={search}
            onChange={(event) => setParam('search', event.target.value)}
            placeholder="Имя, телефон или номер"
            className="w-52"
          />

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
        </div>
      </div>

      {isPending ? (
        <Spinner />
      ) : orders.length === 0 ? (
        <Panel>
          <EmptyState
            title="Заявок пока нет"
            hint="Как только клиент оформит заказ на витрине, он появится здесь"
          />
        </Panel>
      ) : mode === 'board' ? (
        <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragEnd={onDragEnd}>
          <div className="flex gap-3 overflow-x-auto pb-3">
            {columns.map((column) => (
              <Column
                key={column.status}
                status={column.status}
                label={column.label}
                orders={orders.filter((order) => order.status === column.status)}
                onTogglePaid={togglePaid}
              />
            ))}
          </div>
        </DndContext>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              draggable={false}
              highlighted={order.id === focusId}
              onTogglePaid={togglePaid}
            />
          ))}
        </div>
      )}
    </div>
  );
};
