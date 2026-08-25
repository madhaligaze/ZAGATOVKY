import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CircleAlert, Info, TrendingUp } from 'lucide-react';
import { api, keys } from '@/lib/api';
import { Button, Callout, Chip, EmptyState, Field, Input, Panel, Spinner } from '@/components/ui';
import { money } from '@/lib/format';
import { cn } from '@/lib/cn';

/** Локальная дата в формате, который понимает и <input type="date">, и API. */
const isoDay = (date: Date) =>
  new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);

const daysAgo = (days: number) => isoDay(new Date(Date.now() - days * 86_400_000));

const presets = [
  { label: 'Неделя', days: 6 },
  { label: 'Месяц', days: 29 },
  { label: 'Квартал', days: 89 },
];

const statusLabels: Record<string, string> = {
  NEW: 'Новые',
  CONFIRMED: 'Подтверждены',
  COOKING: 'Готовим',
  DELIVERING: 'В пути',
  DONE: 'Доставлены',
};

const Metric = ({
  label,
  value,
  hint,
  tone,
  testId,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: 'accent' | 'muted';
  testId: string;
}) => (
  <div className="rounded-control border border-line bg-surface p-3" data-testid={testId}>
    <p className="label-caps">{label}</p>
    <p
      className={cn(
        'mt-1 text-xl font-semibold tabular-nums tracking-tight',
        tone === 'accent' && 'text-accent',
        tone === 'muted' && 'text-muted',
      )}
    >
      {value}
    </p>
    {hint && <p className="mt-0.5 text-2xs text-faint">{hint}</p>}
  </div>
);

export const FinancePage = () => {
  const [from, setFrom] = useState(daysAgo(29));
  const [to, setTo] = useState(isoDay(new Date()));
  const [paidOnly, setPaidOnly] = useState(false);

  const query = { from, to, paidOnly };
  const { data, isPending, isError } = useQuery({
    queryKey: keys.finance(query),
    queryFn: () => api.finance(query),
  });

  if (isPending) return <Spinner />;
  if (isError || !data) {
    return (
      <Panel>
        <EmptyState title="Отчёт не загрузился" hint="Обновите страницу" />
      </Panel>
    );
  }

  const { totals, coverage, payment } = data;
  const hasCost = totals.profit !== null;
  const covered =
    totals.goods > 0 ? Math.round((coverage.goodsWithCost / totals.goods) * 100) : 0;
  const margin =
    hasCost && totals.goods > 0 ? Math.round(((totals.profit ?? 0) / totals.goods) * 100) : null;

  const maxDay = Math.max(1, ...data.byDay.map((day) => day.revenue));

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Финансы</h1>
        <p className="text-2xs text-muted">
          Отменённые, архивные и тестовые заказы в отчёт не входят
        </p>
      </div>

      {/* Период */}
      <Panel>
        <div className="flex flex-wrap items-end gap-3">
          <Field label="С" className="w-36" compact>
            <Input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} />
          </Field>
          <Field label="По" className="w-36" compact>
            <Input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} />
          </Field>

          <div className="flex flex-wrap gap-1.5">
            {presets.map((preset) => {
              const active = from === daysAgo(preset.days) && to === isoDay(new Date());
              return (
                <Button
                  key={preset.label}
                  size="sm"
                  variant={active ? 'primary' : 'outline'}
                  onClick={() => {
                    setFrom(daysAgo(preset.days));
                    setTo(isoDay(new Date()));
                  }}
                >
                  {preset.label}
                </Button>
              );
            })}
          </div>

          <Button
            size="sm"
            variant={paidOnly ? 'primary' : 'outline'}
            onClick={() => setPaidOnly((value) => !value)}
            title="Считать только заказы с отметкой об оплате"
          >
            Только оплаченные
          </Button>
        </div>
      </Panel>

      {/* Себестоимость необязательна: без неё отчёт не ломается, а честно говорит,
          что показывает только выручку, и подсказывает, где дозаполнить. */}
      {!hasCost ? (
        <Callout tone="accent" icon={<Info size={14} />} title="Прибыль пока не считается">
          Чтобы видеть прибыль, укажите себестоимость товаров в карточке товара — поле
          «Себестоимость» рядом с ценой. Пока её нет, отчёт показывает выручку и количество
          заказов, и это правильные цифры.{' '}
          <Link to="/products" className="underline underline-offset-2">
            Перейти к товарам
          </Link>
        </Callout>
      ) : (
        covered < 100 && (
          <Callout
            tone="warning"
            icon={<CircleAlert size={14} />}
            title={`Себестоимость известна у ${covered}% продаж`}
          >
            Прибыль посчитана только по этой части. Позиции без себестоимости:{' '}
            {coverage.missing.map((item) => item.nameRu).join(', ')}.
          </Callout>
        )
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          testId="metric-revenue"
          label="Выручка"
          value={money(totals.revenue)}
          hint={`Товары ${money(totals.goods)} + доставка ${money(totals.delivery)}`}
          tone="accent"
        />
        <Metric
          testId="metric-orders"
          label="Заказов"
          value={String(totals.orders)}
          hint={`с ${data.from} по ${data.to}`}
        />
        <Metric
          testId="metric-cost"
          label="Себестоимость"
          value={hasCost ? money(totals.cost) : '—'}
          hint={hasCost ? `по ${covered}% продаж` : 'не указана'}
          tone={hasCost ? undefined : 'muted'}
        />
        <Metric
          testId="metric-profit"
          label="Прибыль"
          value={hasCost ? money(totals.profit ?? 0) : '—'}
          hint={
            hasCost
              ? `маржа ${margin}% · доставка в прибыль не входит`
              : 'укажите себестоимость товаров'
          }
          tone={hasCost ? 'accent' : 'muted'}
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Panel title="Оплата">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-2xs text-muted">Отмечены оплаченными</p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-success">
                {money(payment.paidAmount)}
              </p>
              <p className="text-2xs text-faint">{payment.paidCount} заказов</p>
            </div>
            <div>
              <p className="text-2xs text-muted">Ждут оплаты</p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-warning">
                {money(payment.unpaidAmount)}
              </p>
              <p className="text-2xs text-faint">{payment.unpaidCount} заказов</p>
            </div>
          </div>
          <p className="mt-3 text-2xs text-faint">
            Отметку об оплате ставят вручную в разделе «Заказы» — Kaspi по ссылке не сообщает
            сайту о платеже.
          </p>
        </Panel>

        <Panel title="По статусам">
          {data.byStatus.length === 0 ? (
            <p className="text-2xs text-faint">Нет данных за период</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {data.byStatus.map((row) => (
                <li key={row.status} className="flex items-center justify-between gap-2 text-sm">
                  <span className="min-w-0 truncate">{statusLabels[row.status] ?? row.status}</span>
                  <span className="shrink-0 text-2xs text-faint">{row.orders} шт</span>
                  <span className="shrink-0 tabular-nums">{money(row.revenue)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel title="Выручка по дням">
        {data.byDay.length === 0 ? (
          <EmptyState title="За период продаж не было" hint="Выберите другой диапазон" />
        ) : (
          // Горизонтальные полоски вместо графика: читаются на телефоне без библиотеки
          <ul className="flex flex-col gap-1.5">
            {data.byDay.map((day) => (
              <li key={day.key} className="flex items-center gap-2 text-2xs">
                <span className="w-20 shrink-0 tabular-nums text-muted">{day.key.slice(5)}</span>
                <span className="h-4 min-w-0 flex-1 overflow-hidden rounded-control bg-raised">
                  <span
                    className="block h-full rounded-control bg-accent/70"
                    style={{ width: `${Math.max(2, (day.revenue / maxDay) * 100)}%` }}
                  />
                </span>
                <span className="w-24 shrink-0 text-right tabular-nums">{money(day.revenue)}</span>
                <span className="hidden w-16 shrink-0 text-right tabular-nums text-faint sm:block">
                  {day.orders} зак.
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="По товарам" bodyClassName="p-0">
        <div className="hidden gap-3 border-b border-line px-[var(--pad-panel)] py-2 lg:grid lg:grid-cols-[1fr_5rem_8rem_8rem_8rem]">
          <span className="label-caps">Товар</span>
          <span className="label-caps text-right">Штук</span>
          <span className="label-caps text-right">Выручка</span>
          <span className="label-caps text-right">Себестоимость</span>
          <span className="label-caps text-right">Прибыль</span>
        </div>

        {data.byProduct.length === 0 ? (
          <div className="p-[var(--pad-panel)]">
            <EmptyState title="Продаж за период нет" />
          </div>
        ) : (
          <ul className="flex flex-col">
            {data.byProduct.map((row) => (
              <li
                key={row.key}
                className="grid gap-1 border-b border-line px-[var(--pad-panel)] py-2.5 last:border-0 lg:grid-cols-[1fr_5rem_8rem_8rem_8rem] lg:items-center lg:gap-3"
              >
                <span className="min-w-0 truncate text-sm font-medium">{row.key}</span>

                <span className="flex items-center gap-2 text-2xs tabular-nums text-muted lg:justify-end lg:text-sm">
                  <span className="lg:hidden">Штук:</span>
                  {row.qty}
                </span>

                <span className="flex items-center gap-2 text-sm tabular-nums lg:justify-end">
                  <span className="text-2xs text-muted lg:hidden">Выручка:</span>
                  {money(row.goods)}
                </span>

                <span className="flex items-center gap-2 text-sm tabular-nums text-muted lg:justify-end">
                  <span className="text-2xs lg:hidden">Себестоимость:</span>
                  {row.hasCost ? money(row.cost) : <Chip>не указана</Chip>}
                </span>

                <span className="flex items-center gap-2 text-sm font-semibold tabular-nums lg:justify-end">
                  <span className="text-2xs font-normal text-muted lg:hidden">Прибыль:</span>
                  {row.profit === null ? (
                    <span className="text-faint">—</span>
                  ) : (
                    <span className={row.profit >= 0 ? 'text-success' : 'text-danger'}>
                      {money(row.profit)}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <p className="flex items-center gap-2 text-2xs text-faint">
        <TrendingUp size={13} />
        Себестоимость берётся из снимка на момент заказа, поэтому прошлые периоды не меняются,
        когда вы правите закупочные цены сегодня.
      </p>
    </div>
  );
};
