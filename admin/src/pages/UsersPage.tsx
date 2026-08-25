import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { KeyRound, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { api, keys } from '@/lib/api';
import { useWorkspace } from '@/store/workspace';
import { Button, Chip, EmptyState, Field, Input, Panel, Select, Spinner } from '@/components/ui';
import { dateTime } from '@/lib/format';

const roleLabels: Record<string, string> = {
  OWNER: 'Владелец',
  MANAGER: 'Менеджер',
  VIEWER: 'Просмотр',
};

const roleHints: Record<string, string> = {
  OWNER: 'Полный доступ, включая команду и удаление товаров',
  MANAGER: 'Каталог, заказы, витрина и настройки',
  VIEWER: 'Только просмотр без изменений',
};

export const UsersPage = () => {
  const queryClient = useQueryClient();
  const me = useWorkspace((state) => state.user);
  const [form, setForm] = useState({ email: '', name: '', password: '', role: 'MANAGER' });

  const { data, isPending, error } = useQuery({
    queryKey: keys.users,
    queryFn: api.users,
    retry: false,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: keys.users });

  const create = useMutation({
    mutationFn: () => api.createUser(form),
    onSuccess: () => {
      void invalidate();
      setForm({ email: '', name: '', password: '', role: 'MANAGER' });
      toast.success('Пользователь добавлен');
    },
    onError: (cause: Error) => toast.error(cause.message),
  });

  const update = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      api.updateUser(id, body),
    onSuccess: () => {
      void invalidate();
      toast.success('Изменения применены');
    },
    onError: (cause: Error) => toast.error(cause.message),
  });

  if (error) {
    return (
      <Panel>
        <EmptyState
          title="Раздел доступен только владельцу"
          hint="Попросите владельца выдать нужные права"
        />
      </Panel>
    );
  }

  if (isPending || !data) return <Spinner />;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Команда</h1>
        <p className="text-2xs text-muted">Кто имеет доступ в кабинет и с какими правами</p>
      </div>

      {/* Не таблица: на телефоне шесть колонок уезжали вбок и роль с доступом
          приходилось искать горизонтальной прокруткой. Каждый человек — карточка,
          которая на широком экране выстраивается в строку. */}
      <Panel title="Пользователи" bodyClassName="p-0">
        <div className="hidden gap-3 border-b border-line px-[var(--pad-panel)] py-2 lg:grid lg:grid-cols-[1.2fr_1.6fr_10rem_9rem_7rem_7rem]">
          <span className="label-caps">Имя</span>
          <span className="label-caps">Почта</span>
          <span className="label-caps">Роль</span>
          <span className="label-caps">Последний вход</span>
          <span className="label-caps">Доступ</span>
          <span className="label-caps text-right">Пароль</span>
        </div>

        <ul className="flex flex-col">
          {data.map((user) => {
            const isSelf = user.id === me?.id;
            return (
              <li
                key={user.id}
                data-testid={`user-${user.email}`}
                className="grid gap-2 border-b border-line px-[var(--pad-panel)] py-3 last:border-0 lg:grid-cols-[1.2fr_1.6fr_10rem_9rem_7rem_7rem] lg:items-center lg:gap-3"
              >
                <p className="min-w-0 truncate text-sm font-medium">{user.name}</p>
                <p className="min-w-0 truncate text-2xs text-muted lg:text-sm">{user.email}</p>

                <Select
                  value={user.role}
                  disabled={isSelf}
                  onChange={(event) =>
                    update.mutate({ id: user.id, body: { role: event.target.value } })
                  }
                  className="h-8 text-2xs"
                  title={isSelf ? 'Свою роль менять нельзя' : roleHints[user.role]}
                >
                  {Object.entries(roleLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>

                <p className="text-2xs text-muted">
                  <span className="lg:hidden">Последний вход: </span>
                  {user.lastLoginAt ? dateTime(user.lastLoginAt) : 'ни разу'}
                </p>

                <div className="flex flex-wrap items-center gap-2 lg:contents">
                  <button
                    type="button"
                    disabled={isSelf}
                    title={isSelf ? 'Себя отключить нельзя' : 'Переключить доступ'}
                    onClick={() =>
                      update.mutate({ id: user.id, body: { isActive: !user.isActive } })
                    }
                    className="disabled:opacity-50 lg:justify-self-start"
                  >
                    <Chip tone={user.isActive ? 'success' : 'danger'}>
                      {user.isActive ? 'Активен' : 'Отключён'}
                    </Chip>
                  </button>

                  <Button
                    size="sm"
                    variant="outline"
                    title="Сменить пароль"
                    className="lg:justify-self-end"
                    onClick={() => {
                      const password = window.prompt(
                        `Новый пароль для ${user.name} (минимум 8 символов)`,
                      );
                      if (!password) return;
                      if (password.length < 8) {
                        toast.error('Пароль слишком короткий');
                        return;
                      }
                      update.mutate({ id: user.id, body: { password } });
                    }}
                  >
                    <KeyRound size={14} /> Пароль
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      </Panel>

      <Panel title="Добавить пользователя">
        <div className="flex flex-wrap items-end gap-3">
          <Field label="Имя" className="min-w-40 flex-1" hint="Видно в журнале действий">
            <Input
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
          </Field>
          <Field label="Почта" className="min-w-48 flex-1" hint="Ею человек входит в кабинет">
            <Input
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
            />
          </Field>
          <Field label="Пароль" className="min-w-40 flex-1" hint="Минимум 8 символов">
            <Input
              type="text"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
            />
          </Field>
          <Field label="Роль" className="w-40" hint="Что можно менять">
            <Select
              value={form.role}
              onChange={(event) => setForm({ ...form, role: event.target.value })}
            >
              {Object.entries(roleLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
          {/* Кнопка повторяет структуру Field (метка → контрол → строка подсказки),
              иначе в строке с выравниванием по низу она встаёт ниже полей. */}
          <div className="flex flex-col gap-1.5">
            <span className="label-caps invisible" aria-hidden>
              .
            </span>
            <Button
              variant="primary"
              disabled={!form.email || !form.name || form.password.length < 8 || create.isPending}
              onClick={() => create.mutate()}
            >
              <Plus size={15} /> Добавить
            </Button>
            <span className="min-h-4 leading-4" aria-hidden />
          </div>
        </div>

        <p className="mt-3 text-2xs text-faint">{roleHints[form.role]}</p>
      </Panel>
    </div>
  );
};
