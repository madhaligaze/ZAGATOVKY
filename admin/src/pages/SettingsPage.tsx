import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Tabs from '@radix-ui/react-tabs';
import { AlertTriangle, Info, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { api, keys, type AdminCategory, type PublicSettings } from '@/lib/api';
import { Button, Callout, Field, Input, Panel, Spinner, Textarea } from '@/components/ui';

/**
 * Номер из сида. Пока он не заменён, ссылка «написать в WhatsApp» ведёт в никуда —
 * это единственная настройка, без которой витрина внешне работает, а заказы теряются.
 */
export const isDemoWhatsapp = (value: string) => {
  const digits = value.replace(/\D/g, '');
  return digits === '' || digits === '77000000000' || /^7?7?0+$/.test(digits);
};

const tabTrigger =
  'rounded-control px-3 py-1.5 text-2xs font-semibold uppercase tracking-[0.06em] text-muted transition-colors data-[state=active]:bg-accent-soft data-[state=active]:text-ink';

const LocalizedPair = ({
  label,
  value,
  onChange,
  multiline,
}: {
  label: string;
  value: { ru: string; kk: string };
  onChange: (next: { ru: string; kk: string }) => void;
  multiline?: boolean;
}) => {
  const Component = multiline ? Textarea : Input;
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label={`${label} · RU`}>
        <Component
          value={value.ru}
          rows={multiline ? 3 : undefined}
          onChange={(event: { target: { value: string } }) =>
            onChange({ ...value, ru: event.target.value })
          }
        />
      </Field>
      <Field label={`${label} · KK`}>
        <Component
          value={value.kk}
          rows={multiline ? 3 : undefined}
          onChange={(event: { target: { value: string } }) =>
            onChange({ ...value, kk: event.target.value })
          }
        />
      </Field>
    </div>
  );
};

const CategoriesEditor = () => {
  const queryClient = useQueryClient();
  const { data, isPending } = useQuery({ queryKey: keys.categories, queryFn: api.categories });
  const [draft, setDraft] = useState<Record<string, Partial<AdminCategory>>>({});
  const [newName, setNewName] = useState({ ru: '', kk: '' });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: keys.categories });
    void queryClient.invalidateQueries({ queryKey: ['products'] });
  };

  const save = useMutation({
    mutationFn: ({ id, body }: { id: string; body: AdminCategory }) =>
      api.updateCategory(id, {
        nameRu: body.nameRu,
        nameKk: body.nameKk,
        descriptionRu: body.descriptionRu,
        descriptionKk: body.descriptionKk,
        sortOrder: body.sortOrder,
        isVisible: body.isVisible,
      } as never),
    onSuccess: () => {
      invalidate();
      toast.success('Категория сохранена');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const create = useMutation({
    mutationFn: () =>
      api.createCategory({
        nameRu: newName.ru,
        nameKk: newName.kk || newName.ru,
        sortOrder: (data?.length ?? 0) * 10,
        isVisible: true,
      } as never),
    onSuccess: () => {
      invalidate();
      setNewName({ ru: '', kk: '' });
      toast.success('Категория добавлена');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: api.deleteCategory,
    onSuccess: () => {
      invalidate();
      toast.success('Категория удалена, товары остались без категории');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (isPending || !data) return <Spinner />;

  return (
    <div className="flex flex-col gap-3">
      {data.map((category) => {
        const current = { ...category, ...draft[category.id] } as AdminCategory;
        const dirty = Boolean(draft[category.id]);

        return (
          <div
            key={category.id}
            className="flex flex-wrap items-end gap-3 rounded-control border border-line p-3"
          >
            <Field label="Название RU" className="min-w-40 flex-1">
              <Input
                value={current.nameRu}
                onChange={(event) =>
                  setDraft((state) => ({
                    ...state,
                    [category.id]: { ...state[category.id], nameRu: event.target.value },
                  }))
                }
              />
            </Field>

            <Field label="Атауы KK" className="min-w-40 flex-1">
              <Input
                value={current.nameKk}
                onChange={(event) =>
                  setDraft((state) => ({
                    ...state,
                    [category.id]: { ...state[category.id], nameKk: event.target.value },
                  }))
                }
              />
            </Field>

            <label className="flex items-center gap-2 pb-2 text-2xs">
              <input
                type="checkbox"
                checked={current.isVisible}
                onChange={(event) =>
                  setDraft((state) => ({
                    ...state,
                    [category.id]: { ...state[category.id], isVisible: event.target.checked },
                  }))
                }
              />
              Видна
            </label>

            <span className="pb-2 text-2xs text-faint">{category.productCount} товаров</span>

            <Button
              size="sm"
              variant="primary"
              disabled={!dirty}
              onClick={() => {
                save.mutate({ id: category.id, body: current });
                setDraft((state) => {
                  const next = { ...state };
                  delete next[category.id];
                  return next;
                });
              }}
            >
              Сохранить
            </Button>

            <Button
              size="iconSm"
              variant="ghost"
              aria-label="Удалить категорию"
              className="hover:text-danger"
              onClick={() => {
                if (window.confirm(`Удалить категорию «${category.nameRu}»?`)) {
                  remove.mutate(category.id);
                }
              }}
            >
              <Trash2 size={14} />
            </Button>
          </div>
        );
      })}

      <div className="flex flex-wrap items-end gap-3 rounded-control border border-dashed border-line-strong p-3">
        <Field label="Новая категория RU" className="min-w-40 flex-1">
          <Input
            value={newName.ru}
            onChange={(event) => setNewName({ ...newName, ru: event.target.value })}
          />
        </Field>
        <Field label="Атауы KK" className="min-w-40 flex-1">
          <Input
            value={newName.kk}
            onChange={(event) => setNewName({ ...newName, kk: event.target.value })}
          />
        </Field>
        <Button
          variant="primary"
          disabled={!newName.ru.trim()}
          onClick={() => create.mutate()}
        >
          <Plus size={15} /> Добавить
        </Button>
      </div>
    </div>
  );
};

export const SettingsPage = () => {
  const queryClient = useQueryClient();
  const { data, isPending } = useQuery({ queryKey: keys.settings, queryFn: api.publicSettings });
  const [draft, setDraft] = useState<PublicSettings | null>(null);

  useEffect(() => {
    if (data) setDraft(data);
  }, [data]);

  const save = useMutation({
    mutationFn: ({ group, body }: { group: string; body: Record<string, unknown> }) =>
      api.saveSettings(group, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: keys.settings });
      toast.success('Настройки сохранены — витрина обновится сразу');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (isPending || !draft) return <Spinner />;

  const patch = <G extends keyof PublicSettings>(group: G, value: PublicSettings[G]) =>
    setDraft({ ...draft, [group]: value });

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Настройки</h1>
        <p className="text-2xs text-muted">
          Всё, что показывает витрина в шапке, подвале и корзине
        </p>
      </div>

      <Tabs.Root defaultValue="contacts">
        <Tabs.List className="mb-4 flex flex-wrap gap-1 rounded-control bg-raised p-1">
          <Tabs.Trigger value="contacts" className={tabTrigger}>
            Контакты
          </Tabs.Trigger>
          <Tabs.Trigger value="delivery" className={tabTrigger}>
            Доставка
          </Tabs.Trigger>
          <Tabs.Trigger value="payment" className={tabTrigger}>
            Оплата
          </Tabs.Trigger>
          <Tabs.Trigger value="brand" className={tabTrigger}>
            Бренд
          </Tabs.Trigger>
          <Tabs.Trigger value="categories" className={tabTrigger}>
            Категории
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="contacts">
          <Panel
            title="Контакты"
            action={
              <Button
                size="sm"
                variant="primary"
                onClick={() => save.mutate({ group: 'contacts', body: draft.contacts })}
              >
                Сохранить
              </Button>
            }
          >
            <div className="flex flex-col gap-4">
              {/* Из этого номера собирается ссылка «написать нам» на витрине.
                  Пока здесь демо-значение, WhatsApp у клиента открывается
                  с сообщением «номер не зарегистрирован» — и заказ теряется. */}
              {isDemoWhatsapp(draft.contacts.whatsapp) && (
                <Callout
                  tone="warning"
                  icon={<AlertTriangle size={14} />}
                  title="WhatsApp ещё не настроен"
                >
                  Сейчас указан демонстрационный номер {draft.contacts.whatsapp || '—'}. Клиент,
                  оформивший заказ, попадёт в WhatsApp на несуществующий контакт. Впишите рабочий
                  номер цифрами с кодом страны — например 77011234567 — и сохраните.
                </Callout>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Телефон">
                  <Input
                    value={draft.contacts.phone}
                    onChange={(event) =>
                      patch('contacts', { ...draft.contacts, phone: event.target.value })
                    }
                  />
                </Field>
                <Field label="Почта">
                  <Input
                    value={draft.contacts.email}
                    onChange={(event) =>
                      patch('contacts', { ...draft.contacts, email: event.target.value })
                    }
                  />
                </Field>
                <Field label="WhatsApp" hint="Только цифры, например 77001234567">
                  <Input
                    value={draft.contacts.whatsapp}
                    onChange={(event) =>
                      patch('contacts', { ...draft.contacts, whatsapp: event.target.value })
                    }
                    data-testid="settings-whatsapp"
                  />
                </Field>
                <Field label="Telegram" hint="Имя пользователя без @">
                  <Input
                    value={draft.contacts.telegram}
                    onChange={(event) =>
                      patch('contacts', { ...draft.contacts, telegram: event.target.value })
                    }
                  />
                </Field>
                <Field label="Instagram" hint="Имя пользователя без @">
                  <Input
                    value={draft.contacts.instagram}
                    onChange={(event) =>
                      patch('contacts', { ...draft.contacts, instagram: event.target.value })
                    }
                  />
                </Field>
              </div>

              <LocalizedPair
                label="Адрес"
                value={draft.contacts.address}
                onChange={(address) => patch('contacts', { ...draft.contacts, address })}
              />
              <LocalizedPair
                label="Часы работы"
                value={draft.contacts.workingHours}
                onChange={(workingHours) => patch('contacts', { ...draft.contacts, workingHours })}
              />
            </div>
          </Panel>
        </Tabs.Content>

        <Tabs.Content value="delivery">
          <Panel
            title="Доставка"
            action={
              <Button
                size="sm"
                variant="primary"
                onClick={() => save.mutate({ group: 'delivery', body: draft.delivery })}
              >
                Сохранить
              </Button>
            }
          >
            <div className="flex flex-col gap-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Минимальный заказ, тг" hint="Проверяется на сервере при оформлении">
                  <Input
                    inputMode="numeric"
                    value={draft.delivery.minOrder}
                    onChange={(event) =>
                      patch('delivery', {
                        ...draft.delivery,
                        minOrder: Number(event.target.value.replace(/\D/g, '')) || 0,
                      })
                    }
                  />
                </Field>
                <Field label="Стоимость доставки, тг">
                  <Input
                    inputMode="numeric"
                    value={draft.delivery.baseFee}
                    onChange={(event) =>
                      patch('delivery', {
                        ...draft.delivery,
                        baseFee: Number(event.target.value.replace(/\D/g, '')) || 0,
                      })
                    }
                  />
                </Field>
                <Field label="Бесплатно от, тг" hint="Пусто — бесплатной доставки нет">
                  <Input
                    inputMode="numeric"
                    value={draft.delivery.freeFrom ?? ''}
                    onChange={(event) => {
                      const digits = event.target.value.replace(/\D/g, '');
                      patch('delivery', {
                        ...draft.delivery,
                        freeFrom: digits ? Number(digits) : null,
                      });
                    }}
                  />
                </Field>
              </div>

              <LocalizedPair
                label="Адрес самовывоза"
                value={draft.delivery.pickupAddress}
                onChange={(pickupAddress) => patch('delivery', { ...draft.delivery, pickupAddress })}
              />
              <LocalizedPair
                label="Примечание о доставке"
                value={draft.delivery.note}
                onChange={(note) => patch('delivery', { ...draft.delivery, note })}
                multiline
              />
            </div>
          </Panel>
        </Tabs.Content>

        <Tabs.Content value="payment">
          <Panel
            title="Оплата"
            action={
              <Button
                size="sm"
                variant="primary"
                onClick={() => save.mutate({ group: 'payment', body: draft.payment })}
              >
                Сохранить
              </Button>
            }
          >
            <div className="flex flex-col gap-4">
              <Callout icon={<Info size={14} />} title="Как это работает сейчас">
                Клиент оформляет заказ и на странице «спасибо» видит сумму и кнопку
                «Оплатить через Kaspi». Kaspi не сообщает сайту об оплате, поэтому
                отметку «Оплачен» вы ставите сами в карточке заказа. Когда подключим
                эквайринг с обратным вызовом, отметка станет автоматической, а этот
                способ выключится одним переключателем.
              </Callout>

              <label className="flex items-center justify-between gap-3 rounded-control border border-line px-3 py-2.5">
                <span className="text-sm">
                  Показывать кнопку оплаты Kaspi
                  <span className="block text-2xs text-faint">
                    Выключите — клиент просто перейдёт в чат, как раньше
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={draft.payment.kaspiEnabled}
                  onChange={(event) =>
                    patch('payment', { ...draft.payment, kaspiEnabled: event.target.checked })
                  }
                  data-testid="kaspi-enabled"
                />
              </label>

              <Field
                label="Ссылка на оплату из Kaspi Pay"
                hint="Приложение Kaspi Pay → Удалённая оплата → вкладка «Ссылка на оплату»"
              >
                <Input
                  value={draft.payment.kaspiLink}
                  onChange={(event) =>
                    patch('payment', { ...draft.payment, kaspiLink: event.target.value })
                  }
                  placeholder="https://pay.kaspi.kz/pay/..."
                  data-testid="kaspi-link"
                />
              </Field>

              <label className="flex items-center justify-between gap-3 rounded-control border border-line px-3 py-2.5">
                <span className="text-sm">
                  Клиент вводит сумму сам
                  <span className="block text-2xs text-faint">
                    Ссылка на точку не знает суммы заказа. Оставьте включённым — тогда
                    на странице оплаты будет подсказка с суммой и номером заказа
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={draft.payment.kaspiAmountManual}
                  onChange={(event) =>
                    patch('payment', {
                      ...draft.payment,
                      kaspiAmountManual: event.target.checked,
                    })
                  }
                />
              </label>

              <LocalizedPair
                label="Примечание об оплате"
                value={draft.payment.note}
                onChange={(note) => patch('payment', { ...draft.payment, note })}
                multiline
              />
            </div>
          </Panel>
        </Tabs.Content>

        <Tabs.Content value="brand">
          <Panel
            title="Бренд"
            action={
              <Button
                size="sm"
                variant="primary"
                onClick={() => save.mutate({ group: 'brand', body: draft.brand })}
              >
                Сохранить
              </Button>
            }
          >
            <div className="flex flex-col gap-4">
              <Field label="Название">
                <Input
                  value={draft.brand.name}
                  onChange={(event) => patch('brand', { ...draft.brand, name: event.target.value })}
                />
              </Field>
              <LocalizedPair
                label="Описание в подвале"
                value={draft.brand.tagline}
                onChange={(tagline) => patch('brand', { ...draft.brand, tagline })}
                multiline
              />
            </div>
          </Panel>
        </Tabs.Content>

        <Tabs.Content value="categories">
          <Panel title="Категории каталога">
            <CategoriesEditor />
          </Panel>
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
};
