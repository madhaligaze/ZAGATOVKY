import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AlertTriangle, Eye, EyeOff, GripVertical, ImageOff, PackageX } from 'lucide-react';
import { api, keys, type Stats } from '@/lib/api';
import { useWorkspace } from '@/store/workspace';
import { Button, Chip, Panel, Spinner } from '@/components/ui';
import { money, relative } from '@/lib/format';
import { cn } from '@/lib/cn';

const statusLabels: Record<string, string> = {
  NEW: 'Новый',
  CONFIRMED: 'Подтверждён',
  COOKING: 'Готовим',
  DELIVERING: 'В пути',
  DONE: 'Доставлен',
  CANCELLED: 'Отменён',
};

const widgetTitles: Record<string, string> = {
  orders: 'Заказы',
  revenue: 'Выручка',
  attention: 'Требует внимания',
  top: 'Чаще всего заказывают',
  recent: 'Последние заявки',
};

/** Каждый виджет — карточка, которую можно перетащить или скрыть. */
const SortableWidget = ({
  id,
  onHide,
  children,
  className,
}: {
  id: string;
  onHide: () => void;
  children: React.ReactNode;
  className?: string;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn('relative', isDragging && 'z-10 opacity-80', className)}
    >
      <Panel
        title={
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              className="cursor-grab text-faint hover:text-ink active:cursor-grabbing"
              aria-label="Переместить виджет"
              {...attributes}
              {...listeners}
            >
              <GripVertical size={14} />
            </button>
            <h2 className="label-caps">{widgetTitles[id]}</h2>
          </div>
        }
        action={
          <button
            type="button"
            onClick={onHide}
            title="Скрыть виджет"
            className="text-faint transition-colors hover:text-ink"
          >
            <EyeOff size={14} />
          </button>
        }
        className="h-full"
      >
        {children}
      </Panel>
    </div>
  );
};

const Metric = ({ label, value, hint }: { label: string; value: string; hint?: string }) => (
  <div>
    <p className="label-caps">{label}</p>
    <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
    {hint && <p className="text-2xs text-faint">{hint}</p>}
  </div>
);

const widgetBody = (id: string, stats: Stats) => {
  switch (id) {
    case 'orders':
      return (
        <div className="grid grid-cols-2 gap-4">
          <Metric label="Сегодня" value={String(stats.orders.today)} />
          <Metric label="За неделю" value={String(stats.orders.week)} />
          <Metric label="Новых" value={String(stats.orders.new)} hint="ждут подтверждения" />
          <Metric label="В работе" value={String(stats.orders.inProgress)} />
        </div>
      );

    case 'revenue':
      return (
        <div className="flex flex-col gap-4">
          <Metric label="Сегодня" value={money(stats.revenue.today)} />
          <div className="grid grid-cols-2 gap-4 border-t border-line pt-4">
            <Metric label="Неделя" value={money(stats.revenue.week)} />
            <Metric label="30 дней" value={money(stats.revenue.month)} />
          </div>
          <p className="text-2xs text-faint">Отменённые и тестовые заказы не учитываются</p>
        </div>
      );

    case 'attention': {
      const rows = [
        {
          icon: ImageOff,
          label: 'Без фото',
          value: stats.catalog.withoutPhoto,
          to: '/products',
          tone: stats.catalog.withoutPhoto > 0 ? ('warning' as const) : ('neutral' as const),
        },
        {
          icon: PackageX,
          label: 'Нет в наличии',
          value: stats.catalog.outOfStock,
          to: '/products?status=out',
          tone: stats.catalog.outOfStock > 0 ? ('danger' as const) : ('neutral' as const),
        },
        {
          icon: EyeOff,
          label: 'Скрыты с витрины',
          value: stats.catalog.hidden,
          to: '/products?status=hidden',
          tone: 'neutral' as const,
        },
      ];

      return (
        <ul className="flex flex-col gap-1">
          {rows.map((row) => (
            <li key={row.label}>
              <Link
                to={row.to}
                className="flex items-center gap-3 rounded-control px-2 py-2 transition-colors hover:bg-raised"
              >
                <row.icon size={16} className="text-muted" />
                <span className="flex-1 text-sm">{row.label}</span>
                <Chip tone={row.tone}>{row.value}</Chip>
              </Link>
            </li>
          ))}
          {stats.catalog.withoutPhoto > 0 && (
            <li className="mt-2 flex items-start gap-2 rounded-control bg-warning/10 px-3 py-2 text-2xs text-warning">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              Витрина показывает буквенные заглушки вместо фото. Загрузите снимки в карточках
              товаров.
            </li>
          )}
        </ul>
      );
    }

    case 'top':
      return stats.topProducts.length === 0 ? (
        <p className="py-6 text-center text-2xs text-muted">Пока нет данных за 30 дней</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {stats.topProducts.map((product, index) => (
            <li key={product.nameRu} className="flex items-center gap-3">
              <span className="w-4 text-2xs tabular-nums text-faint">{index + 1}</span>
              <span className="flex-1 truncate text-sm">{product.nameRu}</span>
              <span className="text-2xs tabular-nums text-muted">{product.qty} шт</span>
              <span className="w-24 text-right text-sm tabular-nums">{money(product.revenue)}</span>
            </li>
          ))}
        </ul>
      );

    case 'recent':
      return stats.recentOrders.length === 0 ? (
        <p className="py-6 text-center text-2xs text-muted">Заявок пока не было</p>
      ) : (
        <ul className="flex flex-col divide-y divide-[color:var(--color-line)]">
          {stats.recentOrders.map((order) => (
            <li key={order.id}>
              <Link
                to={`/orders?focus=${order.id}`}
                className="flex items-center gap-3 py-2 transition-colors hover:text-accent"
              >
                <span className="text-2xs tabular-nums text-faint">{order.number}</span>
                <span className="flex-1 truncate text-sm">{order.customerName}</span>
                <Chip tone={order.status === 'NEW' ? 'accent' : 'neutral'}>
                  {statusLabels[order.status] ?? order.status}
                </Chip>
                <span className="w-24 text-right text-sm tabular-nums">{money(order.total)}</span>
                <span className="hidden w-24 text-right text-2xs text-faint sm:block">
                  {relative(order.createdAt)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      );

    default:
      return null;
  }
};

const widgetSpan: Record<string, string> = {
  orders: 'md:col-span-2',
  revenue: 'md:col-span-2',
  attention: 'md:col-span-2',
  top: 'md:col-span-3',
  recent: 'md:col-span-3',
};

export const DashboardPage = () => {
  const workspace = useWorkspace((state) => state.workspace);
  const patch = useWorkspace((state) => state.patchWorkspace);

  const { data: stats, isPending } = useQuery({
    queryKey: keys.stats,
    queryFn: api.stats,
    refetchInterval: 60_000,
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const visible = useMemo(
    () => workspace.widgets.filter((id) => !workspace.hiddenWidgets.includes(id)),
    [workspace.widgets, workspace.hiddenWidgets],
  );

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const from = workspace.widgets.indexOf(String(active.id));
    const to = workspace.widgets.indexOf(String(over.id));
    if (from < 0 || to < 0) return;

    patch({ widgets: arrayMove(workspace.widgets, from, to) });
  };

  if (isPending || !stats) return <Spinner />;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Обзор</h1>
          <p className="text-2xs text-muted">
            Виджеты можно перетаскивать и скрывать — раскладка сохраняется в вашем профиле
          </p>
        </div>

        {workspace.hiddenWidgets.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="label-caps">Скрыты:</span>
            {workspace.hiddenWidgets.map((id) => (
              <Button
                key={id}
                size="sm"
                variant="subtle"
                onClick={() =>
                  patch({ hiddenWidgets: workspace.hiddenWidgets.filter((item) => item !== id) })
                }
              >
                <Eye size={13} /> {widgetTitles[id]}
              </Button>
            ))}
          </div>
        )}
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={visible} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
            {visible.map((id) => (
              <SortableWidget
                key={id}
                id={id}
                className={widgetSpan[id]}
                onHide={() => patch({ hiddenWidgets: [...workspace.hiddenWidgets, id] })}
              >
                {widgetBody(id, stats)}
              </SortableWidget>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};
