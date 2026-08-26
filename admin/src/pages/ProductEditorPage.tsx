import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Tabs from '@radix-ui/react-tabs';
import { ArrowLeft, Info, Minus, Package, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { api, keys, ApiError, type ProductBody } from '@/lib/api';
import { MediaPicker, type PickedImage } from '@/components/MediaPicker';
import {
  Button,
  Callout,
  Chip,
  Field,
  Input,
  Panel,
  SaveButton,
  Select,
  Spinner,
  Textarea,
} from '@/components/ui';
import { money, weight as formatWeight } from '@/lib/format';
import { cn } from '@/lib/cn';

type Draft = {
  slug: string;
  type: 'SIMPLE' | 'BUNDLE';
  nameRu: string;
  nameKk: string;
  shortRu: string;
  shortKk: string;
  descriptionRu: string;
  descriptionKk: string;
  price: number;
  compareAtPrice: number | null;
  costPrice: number | null;
  weightValue: number;
  weightUnit: 'G' | 'ML' | 'PORTION' | 'PCS';
  categoryId: string;
  stockStatus: 'IN_STOCK' | 'LOW' | 'OUT';
  isActive: boolean;
  isFeatured: boolean;
  images: PickedImage[];
  badgeCodes: string[];
  bundleItems: { componentId: string; qty: number }[];
};

const emptyDraft = (type: 'SIMPLE' | 'BUNDLE'): Draft => ({
  slug: '',
  type,
  nameRu: '',
  nameKk: '',
  shortRu: '',
  shortKk: '',
  descriptionRu: '',
  descriptionKk: '',
  price: 0,
  compareAtPrice: null,
  costPrice: null,
  weightValue: 0,
  weightUnit: 'G',
  categoryId: '',
  stockStatus: 'IN_STOCK',
  isActive: true,
  isFeatured: false,
  images: [],
  badgeCodes: [],
  bundleItems: [],
});

const tabTrigger =
  'rounded-control px-3 py-1.5 text-2xs font-semibold uppercase tracking-[0.06em] text-muted transition-colors data-[state=active]:bg-accent-soft data-[state=active]:text-ink';

export const ProductEditorPage = () => {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const isNew = !id || id === 'new';
  const [draft, setDraft] = useState<Draft>(() =>
    emptyDraft(params.get('type') === 'BUNDLE' ? 'BUNDLE' : 'SIMPLE'),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: product, isPending } = useQuery({
    queryKey: keys.product(id ?? ''),
    queryFn: () => api.product(id!),
    enabled: !isNew,
  });

  const { data: categories } = useQuery({ queryKey: keys.categories, queryFn: api.categories });
  const { data: badges } = useQuery({ queryKey: keys.badges, queryFn: api.badges });
  const { data: allProducts } = useQuery({
    queryKey: keys.products({ forBundle: true }),
    queryFn: () => api.products({ type: 'SIMPLE', limit: 200 }),
    enabled: draft.type === 'BUNDLE',
  });

  useEffect(() => {
    if (!product) return;
    setDraft({
      slug: product.slug,
      type: product.type,
      nameRu: product.name.ru,
      nameKk: product.name.kk,
      shortRu: product.short.ru ?? '',
      shortKk: product.short.kk ?? '',
      descriptionRu: product.description.ru ?? '',
      descriptionKk: product.description.kk ?? '',
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      costPrice: product.costPrice,
      weightValue: product.weight.value,
      weightUnit: product.weight.unit,
      categoryId: product.category?.id ?? '',
      stockStatus: product.stockStatus,
      isActive: product.isActive,
      isFeatured: product.isFeatured,
      images: product.images.map((image) => ({
        assetId: image.id,
        url: image.url,
        altRu: image.alt.ru,
        altKk: image.alt.kk,
        width: image.width,
        height: image.height,
      })),
      badgeCodes: product.badges.map((badge) => badge.code),
      bundleItems: product.bundleItems.map((item) => ({
        componentId: item.product.id,
        qty: item.qty,
      })),
    });
  }, [product]);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  const componentsById = useMemo(
    () => new Map((allProducts?.items ?? []).map((item) => [item.id, item])),
    [allProducts],
  );

  // Сумма компонентов набора — сразу видно, выгоден ли он клиенту
  const componentsTotal = draft.bundleItems.reduce((sum, item) => {
    const component = componentsById.get(item.componentId);
    return sum + (component?.price ?? 0) * item.qty;
  }, 0);
  const savings = componentsTotal - draft.price;

  const save = useMutation({
    mutationFn: (body: ProductBody) =>
      isNew ? api.createProduct(body) : api.updateProduct(id!, body),
    onSuccess: (saved) => {
      void queryClient.invalidateQueries({ queryKey: ['products'] });
      void queryClient.invalidateQueries({ queryKey: keys.stats });
      toast.success(isNew ? 'Товар создан' : 'Изменения сохранены');
      if (isNew) navigate(`/products/${saved.id}`, { replace: true });
    },
    onError: (error: Error) =>
      toast.error(error instanceof ApiError ? error.message : 'Не удалось сохранить'),
  });

  const remove = useMutation({
    mutationFn: () => api.deleteProduct(id!),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Товар удалён');
      navigate('/products');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const submit = () => {
    const nextErrors: Record<string, string> = {};
    if (!draft.nameRu.trim()) nextErrors.nameRu = 'Укажите название';
    if (!draft.nameKk.trim()) nextErrors.nameKk = 'Нужен перевод на казахский';
    if (draft.price <= 0) nextErrors.price = 'Цена должна быть больше нуля';
    if (draft.type === 'BUNDLE' && draft.bundleItems.length === 0) {
      nextErrors.bundle = 'Добавьте хотя бы одну позицию в набор';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      toast.error(Object.values(nextErrors)[0]);
      return;
    }

    save.mutate({
      slug: draft.slug || undefined,
      type: draft.type,
      nameRu: draft.nameRu.trim(),
      nameKk: draft.nameKk.trim(),
      shortRu: draft.shortRu || null,
      shortKk: draft.shortKk || null,
      descriptionRu: draft.descriptionRu || null,
      descriptionKk: draft.descriptionKk || null,
      price: draft.price,
      compareAtPrice: draft.compareAtPrice,
      costPrice: draft.costPrice,
      weightValue: draft.weightValue,
      weightUnit: draft.weightUnit,
      categoryId: draft.categoryId || null,
      stockStatus: draft.stockStatus,
      isActive: draft.isActive,
      isFeatured: draft.isFeatured,
      sortOrder: product?.sortOrder ?? 0,
      images: draft.images.map((image) => ({
        assetId: image.assetId,
        altRu: image.altRu ?? null,
        altKk: image.altKk ?? null,
      })),
      badgeCodes: draft.badgeCodes,
      bundleItems: draft.bundleItems,
    } as ProductBody);
  };

  if (!isNew && isPending) return <Spinner />;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="ghost" size="iconSm" aria-label="Назад">
          <Link to="/products">
            <ArrowLeft size={16} />
          </Link>
        </Button>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-semibold tracking-tight">
            {isNew
              ? draft.type === 'BUNDLE'
                ? 'Новый набор'
                : 'Новый товар'
              : draft.nameRu || 'Товар'}
          </h1>
          <p className="text-2xs text-muted">
            {draft.type === 'BUNDLE'
              ? 'Набор продаётся как отдельный товар со своей ценой'
              : 'Отдельная заготовка в каталоге'}
          </p>
        </div>

        {!isNew && (
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              if (window.confirm('Удалить товар? Действие необратимо.')) remove.mutate();
            }}
          >
            <Trash2 size={14} /> Удалить
          </Button>
        )}

        <SaveButton
          size="md"
          isPending={save.isPending}
          isSuccess={save.isSuccess}
          onClick={submit}
          data-testid="save-product"
        />
      </div>

      {isNew && (
        <Callout icon={<Info size={14} />} tone="accent" title="Что заполнить обязательно">
          Название на двух языках, цена и вес — без них товар не сохранится. Всё
          остальное можно добавить позже: товар до публикации держите выключенным
          переключателем «Показывать на витрине» справа.
        </Callout>
      )}

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <div className="flex flex-col gap-4">
          <Panel title="Тексты">
            <Tabs.Root defaultValue="ru">
              <Tabs.List className="mb-4 flex gap-1 rounded-control bg-raised p-1">
                <Tabs.Trigger value="ru" className={tabTrigger}>
                  Русский
                </Tabs.Trigger>
                <Tabs.Trigger value="kk" className={tabTrigger} data-testid="tab-kk">
                  Қазақша
                </Tabs.Trigger>
              </Tabs.List>

              <Tabs.Content value="ru" className="flex flex-col gap-4">
                <Field
                  label="Название"
                  error={errors.nameRu}
                  hint="Как товар называется в каталоге и в заказе"
                >
                  <Input
                    value={draft.nameRu}
                    onChange={(event) => set('nameRu', event.target.value)}
                    data-testid="name-ru"
                  />
                </Field>
                <Field
                  label="Короткое описание"
                  hint="Одна строка под названием в каталоге. Например: «Очищена и нарезана соломкой»"
                >
                  <Input
                    value={draft.shortRu}
                    onChange={(event) => set('shortRu', event.target.value)}
                  />
                </Field>
                <Field
                  label="Полное описание"
                  hint="Виден только на странице товара. Расскажите, как нарезано и для чего подходит"
                >
                  <Textarea
                    rows={5}
                    value={draft.descriptionRu}
                    onChange={(event) => set('descriptionRu', event.target.value)}
                  />
                </Field>
              </Tabs.Content>

              <Tabs.Content value="kk" className="flex flex-col gap-4">
                <Field
                  label="Атауы"
                  error={errors.nameKk}
                  hint="Обязательно: без перевода казахская версия витрины покажет пустое место"
                >
                  <Input
                    value={draft.nameKk}
                    onChange={(event) => set('nameKk', event.target.value)}
                    data-testid="name-kk"
                  />
                </Field>
                <Field label="Қысқаша сипаттама">
                  <Input
                    value={draft.shortKk}
                    onChange={(event) => set('shortKk', event.target.value)}
                  />
                </Field>
                <Field label="Толық сипаттама">
                  <Textarea
                    rows={5}
                    value={draft.descriptionKk}
                    onChange={(event) => set('descriptionKk', event.target.value)}
                  />
                </Field>
              </Tabs.Content>
            </Tabs.Root>
          </Panel>

          <Panel title="Фото">
            <MediaPicker value={draft.images} onChange={(images) => set('images', images)} />
          </Panel>

          {draft.type === 'BUNDLE' && (
            <Panel title="Состав набора">
              <div className="flex flex-col gap-3">
                <Callout icon={<Package size={14} />} title="Как устроен набор">
                  Набор — это отдельный товар со своей ценой и своим фото. Позиции ниже
                  нужны, чтобы показать покупателю состав и выгоду. Склад по ним
                  не списывается, цена набора не складывается автоматически — вы задаёте
                  её сами в поле «Цена».
                </Callout>

                {draft.bundleItems.length === 0 && (
                  <p className="text-2xs text-danger">{errors.bundle ?? 'Набор пока пуст'}</p>
                )}

                {draft.bundleItems.map((item, index) => {
                  const component = componentsById.get(item.componentId);
                  return (
                    <div
                      key={item.componentId}
                      className="flex items-center gap-3 rounded-control border border-line px-3 py-2"
                    >
                      <span className="flex-1 truncate text-sm">
                        {component?.name.ru ?? 'Позиция удалена'}
                        {component && (
                          <span className="ml-2 text-2xs text-faint">
                            {formatWeight(component.weight.value, component.weight.unit)} ·{' '}
                            {money(component.price)}
                          </span>
                        )}
                      </span>

                      <div className="flex items-center rounded-control border border-line">
                        <button
                          type="button"
                          aria-label="Меньше"
                          onClick={() =>
                            set(
                              'bundleItems',
                              draft.bundleItems.map((row, rowIndex) =>
                                rowIndex === index
                                  ? { ...row, qty: Math.max(1, row.qty - 1) }
                                  : row,
                              ),
                            )
                          }
                          className="grid h-7 w-7 place-items-center hover:bg-raised"
                        >
                          <Minus size={13} />
                        </button>
                        <span className="w-6 text-center text-sm tabular-nums">{item.qty}</span>
                        <button
                          type="button"
                          aria-label="Больше"
                          onClick={() =>
                            set(
                              'bundleItems',
                              draft.bundleItems.map((row, rowIndex) =>
                                rowIndex === index ? { ...row, qty: row.qty + 1 } : row,
                              ),
                            )
                          }
                          className="grid h-7 w-7 place-items-center hover:bg-raised"
                        >
                          <Plus size={13} />
                        </button>
                      </div>

                      <button
                        type="button"
                        aria-label="Убрать из набора"
                        onClick={() =>
                          set(
                            'bundleItems',
                            draft.bundleItems.filter((row) => row.componentId !== item.componentId),
                          )
                        }
                        className="text-faint hover:text-danger"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}

                <Select
                  value=""
                  onChange={(event) => {
                    const componentId = event.target.value;
                    if (!componentId) return;
                    if (draft.bundleItems.some((item) => item.componentId === componentId)) return;
                    set('bundleItems', [...draft.bundleItems, { componentId, qty: 1 }]);
                  }}
                  data-testid="add-bundle-item"
                >
                  <option value="">Добавить позицию в набор…</option>
                  {allProducts?.items
                    .filter(
                      (item) => !draft.bundleItems.some((row) => row.componentId === item.id),
                    )
                    .map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name.ru} — {money(item.price)}
                      </option>
                    ))}
                </Select>

                {/* Экономика набора: сразу видно, есть ли смысл покупателю */}
                {draft.bundleItems.length > 0 && (
                  <div className="flex flex-wrap items-center gap-4 rounded-control bg-raised px-3 py-2.5">
                    <span className="text-2xs text-muted">
                      По отдельности:{' '}
                      <span className="font-semibold text-ink">{money(componentsTotal)}</span>
                    </span>
                    <span className="text-2xs text-muted">
                      Цена набора:{' '}
                      <span className="font-semibold text-ink">{money(draft.price)}</span>
                    </span>
                    <Chip
                      tone={savings > 0 ? 'success' : savings === 0 ? 'neutral' : 'danger'}
                      className="ml-auto"
                    >
                      {savings > 0
                        ? `Выгода ${money(savings)} (${Math.round((savings / componentsTotal) * 100)}%)`
                        : savings === 0
                          ? 'Без выгоды'
                          : `Дороже на ${money(-savings)}`}
                    </Chip>
                  </div>
                )}
              </div>
            </Panel>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <Panel title="Цена и наличие">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Цена, тг" error={errors.price} hint="Целые тенге, без копеек">
                <Input
                  inputMode="numeric"
                  value={draft.price || ''}
                  onChange={(event) =>
                    set('price', Number.parseInt(event.target.value.replace(/\D/g, ''), 10) || 0)
                  }
                  data-testid="price"
                />
              </Field>

              <Field label="Старая цена" hint="Зачёркнута рядом. Пусто — скидки нет">
                <Input
                  inputMode="numeric"
                  value={draft.compareAtPrice ?? ''}
                  onChange={(event) => {
                    const digits = event.target.value.replace(/\D/g, '');
                    set('compareAtPrice', digits ? Number.parseInt(digits, 10) : null);
                  }}
                />
              </Field>

              {/* Себестоимость на витрину не уходит — она нужна только отчёту.
                  Поле необязательное: без него «Финансы» считают выручку. */}
              <Field
                label="Себестоимость, тг"
                hint={
                  draft.costPrice
                    ? `Прибыль с единицы: ${money(Math.max(draft.price - draft.costPrice, 0))}`
                    : 'Не видна покупателям. Без неё отчёт покажет только выручку'
                }
              >
                <Input
                  inputMode="numeric"
                  placeholder="не указана"
                  value={draft.costPrice ?? ''}
                  onChange={(event) => {
                    const digits = event.target.value.replace(/\D/g, '');
                    set('costPrice', digits ? Number.parseInt(digits, 10) : null);
                  }}
                  data-testid="cost-price"
                />
              </Field>

              <Field
                label="Маржа"
                hint={
                  draft.costPrice
                    ? 'Считается автоматически по цене и себестоимости'
                    : 'Появится, когда укажете себестоимость'
                }
              >
                <div className="flex h-9 items-center rounded-control border border-line bg-raised px-3 text-sm tabular-nums">
                  {draft.costPrice && draft.price > 0
                    ? `${Math.round(((draft.price - draft.costPrice) / draft.price) * 100)} %`
                    : '—'}
                </div>
              </Field>

              <Field label="Вес / объём" hint="Число: 250, 400, 1">
                <Input
                  inputMode="numeric"
                  value={draft.weightValue || ''}
                  onChange={(event) =>
                    set(
                      'weightValue',
                      Number.parseInt(event.target.value.replace(/\D/g, ''), 10) || 0,
                    )
                  }
                  data-testid="weight"
                />
              </Field>

              <Field label="Единица" hint="Показывается рядом с ценой">
                <Select
                  value={draft.weightUnit}
                  onChange={(event) => set('weightUnit', event.target.value as Draft['weightUnit'])}
                >
                  <option value="G">граммы</option>
                  <option value="ML">миллилитры</option>
                  <option value="PORTION">порции</option>
                  <option value="PCS">штуки</option>
                </Select>
              </Field>

              <Field
                label="Наличие"
                className="col-span-2"
                hint="«Нет в наличии» оставляет товар на витрине, но кнопку «В корзину» отключает"
              >
                <Select
                  value={draft.stockStatus}
                  onChange={(event) =>
                    set('stockStatus', event.target.value as Draft['stockStatus'])
                  }
                >
                  <option value="IN_STOCK">В наличии</option>
                  <option value="LOW">Заканчивается</option>
                  <option value="OUT">Нет в наличии</option>
                </Select>
              </Field>
            </div>
          </Panel>

          <Panel title="Размещение">
            <div className="flex flex-col gap-3">
              <Field label="Категория" hint="Определяет, под каким фильтром товар найдут в каталоге">
                <Select
                  value={draft.categoryId}
                  onChange={(event) => set('categoryId', event.target.value)}
                >
                  <option value="">Без категории</option>
                  {categories?.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.nameRu}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field
                label="Адрес страницы"
                hint="Часть ссылки: /product/svekla. Оставьте пустым — создадим из названия"
              >
                <Input
                  value={draft.slug}
                  onChange={(event) => set('slug', event.target.value)}
                  placeholder="svekla"
                />
              </Field>

              <div className="flex flex-col gap-2">
                <span className="label-caps">Бейджи</span>
                <p className="-mt-1 text-2xs text-faint">
                  Метки на фото в каталоге. Работают, когда их мало: два бейджа
                  на карточку — предел, больше витрина не покажет.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {badges?.map((badge) => {
                    const active = draft.badgeCodes.includes(badge.code);
                    return (
                      <button
                        key={badge.code}
                        type="button"
                        onClick={() =>
                          set(
                            'badgeCodes',
                            active
                              ? draft.badgeCodes.filter((code) => code !== badge.code)
                              : [...draft.badgeCodes, badge.code],
                          )
                        }
                        className={cn(
                          'rounded-control border px-2 py-1 text-2xs font-semibold uppercase tracking-[0.05em] transition-colors',
                          active
                            ? 'border-accent bg-accent-soft text-ink'
                            : 'border-line text-muted hover:border-line-strong',
                        )}
                      >
                        {badge.labelRu}
                      </button>
                    );
                  })}
                </div>
              </div>

              <label className="flex items-center justify-between gap-3 rounded-control border border-line px-3 py-2">
                <span className="text-sm">Показывать на витрине</span>
                <input
                  type="checkbox"
                  checked={draft.isActive}
                  onChange={(event) => set('isActive', event.target.checked)}
                  data-testid="is-active"
                />
              </label>

              <label className="flex items-center justify-between gap-3 rounded-control border border-line px-3 py-2">
                <span className="text-sm">
                  Избранное
                  <span className="block text-2xs text-faint">попадает в блок на главной</span>
                </span>
                <input
                  type="checkbox"
                  checked={draft.isFeatured}
                  onChange={(event) => set('isFeatured', event.target.checked)}
                />
              </label>
            </div>
          </Panel>

          {/* Живое превью: карточка ровно такая, какой её увидит покупатель */}
          <Panel title="Как это выглядит на витрине">
            <div className="mx-auto w-full max-w-56 overflow-hidden border border-line bg-white">
              {draft.images[0] ? (
                <img
                  src={draft.images[0].url}
                  alt=""
                  className="aspect-[4/5] w-full object-cover"
                />
              ) : (
                <div
                  className="relative flex aspect-[4/5] items-center justify-center bg-[#ebe7e1]"
                  aria-hidden
                >
                  <div
                    className="absolute inset-0 opacity-[0.07]"
                    style={{
                      backgroundImage:
                        'repeating-linear-gradient(135deg, #193741 0 1px, transparent 1px 9px)',
                    }}
                  />
                  <span
                    className="relative text-5xl leading-none text-[#193741]/25"
                    style={{ fontFamily: 'var(--font-editorial)' }}
                  >
                    {(draft.nameRu.trim().charAt(0) || 'З').toUpperCase()}
                  </span>
                </div>
              )}

              <div className="flex flex-col gap-2 border-t border-[#e3ded7] p-4 text-[#193741]">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold leading-tight">
                    {draft.nameRu || 'Название товара'}
                  </p>
                  <span className="shrink-0 text-2xs uppercase tracking-[0.1em] text-[#8c9ba0]">
                    {formatWeight(draft.weightValue, draft.weightUnit)}
                  </span>
                </div>
                {draft.shortRu && <p className="text-2xs text-[#8c9ba0]">{draft.shortRu}</p>}
                <p
                  className="mt-1 text-lg leading-none"
                  style={{ fontFamily: 'var(--font-editorial)' }}
                >
                  {money(draft.price)}
                </p>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
};
