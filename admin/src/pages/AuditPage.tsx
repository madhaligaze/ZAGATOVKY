import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, keys } from '@/lib/api';
import { Chip, EmptyState, Panel, Select, Spinner } from '@/components/ui';
import { dateTime } from '@/lib/format';

const entityLabels: Record<string, string> = {
  product: 'Товар',
  category: 'Категория',
  collection: 'Подборка',
  homeSection: 'Секция главной',
  settings: 'Настройки',
  order: 'Заказ',
  media: 'Медиа',
  user: 'Пользователь',
};

const actionLabels: Record<string, string> = {
  create: 'создание',
  update: 'изменение',
  delete: 'удаление',
  bulk: 'массовая правка',
  login: 'вход',
};

const actionTones = {
  create: 'success',
  update: 'accent',
  delete: 'danger',
  bulk: 'warning',
  login: 'neutral',
} as const;

export const AuditPage = () => {
  const [entity, setEntity] = useState('');

  const { data, isPending } = useQuery({
    queryKey: keys.audit({ entity }),
    queryFn: () => api.audit({ entity, limit: 150 }),
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Журнал действий</h1>
          <p className="text-2xs text-muted">Кто и что менял в кабинете</p>
        </div>

        <Select value={entity} onChange={(event) => setEntity(event.target.value)} className="w-52">
          <option value="">Все разделы</option>
          {Object.entries(entityLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </div>

      <Panel bodyClassName="p-0">
        {isPending ? (
          <Spinner />
        ) : !data || data.items.length === 0 ? (
          <EmptyState title="Записей пока нет" hint="Здесь появятся все правки каталога и настроек" />
        ) : (
          <ul className="divide-y divide-[color:var(--color-line)]">
            {data.items.map((row) => (
              <li key={row.id} className="flex flex-wrap items-center gap-3 px-4 py-2.5">
                <span className="w-32 shrink-0 text-2xs tabular-nums text-faint">
                  {dateTime(row.createdAt)}
                </span>

                <Chip tone={actionTones[row.action as keyof typeof actionTones] ?? 'neutral'}>
                  {actionLabels[row.action] ?? row.action}
                </Chip>

                <span className="text-sm">{entityLabels[row.entity] ?? row.entity}</span>

                <span className="text-2xs text-muted">{row.userName ?? 'система'}</span>

                {row.diff ? (
                  <details className="ml-auto min-w-0 basis-full sm:basis-auto">
                    <summary className="cursor-pointer text-2xs text-faint hover:text-ink">
                      что изменилось
                    </summary>
                    <pre className="mt-1 max-h-40 overflow-auto rounded-control bg-raised p-2 font-mono text-2xs">
                      {JSON.stringify(row.diff, null, 2)}
                    </pre>
                  </details>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
};
