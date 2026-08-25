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

      <Panel title="Пользователи" bodyClassName="p-0">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-line text-left">
              <th className="cell label-caps">Имя</th>
              <th className="cell label-caps">Почта</th>
              <th className="cell label-caps">Роль</th>
              <th className="cell label-caps">Последний вход</th>
              <th className="cell label-caps">Доступ</th>
              <th className="cell" />
            </tr>
          </thead>
          <tbody>
            {data.map((user) => {
              const isSelf = user.id === me?.id;
              return (
                <tr key={user.id} className="border-b border-line last:border-0">
                  <td className="cell font-medium">
                    {user.name}
                    {isSelf && <span className="ml-2 text-2xs text-faint">это вы</span>}
                  </td>
                  <td className="cell text-muted">{user.email}</td>
                  <td className="cell">
                    <Select
                      value={user.role}
                      disabled={isSelf}
                      onChange={(event) =>
                        update.mutate({ id: user.id, body: { role: event.target.value } })
                      }
                      className="h-7 w-auto py-0 text-2xs"
                      title={roleHints[user.role]}
                    >
                      {Object.entries(roleLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </Select>
                  </td>
                  <td className="cell text-2xs text-muted">
                    {user.lastLoginAt ? dateTime(user.lastLoginAt) : 'ни разу'}
                  </td>
                  <td className="cell">
                    <button
                      type="button"
                      disabled={isSelf}
                      onClick={() =>
                        update.mutate({ id: user.id, body: { isActive: !user.isActive } })
                      }
                      className="disabled:opacity-50"
                    >
                      <Chip tone={user.isActive ? 'success' : 'danger'}>
                        {user.isActive ? 'Активен' : 'Отключён'}
                      </Chip>
                    </button>
                  </td>
                  <td className="cell text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      title="Сменить пароль"
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
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Panel>

      <Panel title="Добавить пользователя">
        <div className="flex flex-wrap items-end gap-3">
          <Field label="Имя" className="min-w-40 flex-1">
            <Input
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
          </Field>
          <Field label="Почта" className="min-w-48 flex-1">
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
          <Field label="Роль" className="w-40">
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
          <Button
            variant="primary"
            disabled={!form.email || !form.name || form.password.length < 8 || create.isPending}
            onClick={() => create.mutate()}
          >
            <Plus size={15} /> Добавить
          </Button>
        </div>

        <p className="mt-3 text-2xs text-faint">{roleHints[form.role]}</p>
      </Panel>
    </div>
  );
};
