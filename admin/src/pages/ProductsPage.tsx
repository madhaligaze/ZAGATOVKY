import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bookmark, Check, Columns3, Plus, Search, X } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { toast } from 'sonner';
import { api, keys, type AdminProduct } from '@/lib/api';
import { useWorkspace, type SavedView } from '@/store/workspace';
import { Button, Chip, EmptyState, Input, Select, Spinner } from '@/components/ui';
import { money, weight } from '@/lib/format';
import { cn } from '@/lib/cn';

type ColumnId = 'photo' | 'name' | 'category' | 'price' | 'weight' | 'stock' | 'visible';

const allColumns: { id: ColumnId; label: string; locked?: boolean }[] = [
  { id: 'photo', label: 'Фото' },
  { id: 'name', label: 'Название', locked: true },
  { id: 'category', label: 'Категория' },
  { id: 'price', label: 'Цена' },
  { id: 'weight', label: 'Вес' },
  { id: 'stock', label: 'Наличие' },
  { id: 'visible', label: 'На витрине' },
];

const stockLabels = { IN_STOCK: 'В наличии', LOW: 'Заканчивается', OUT: 'Нет' } as const;
const stockTones = { IN_STOCK: 'success', LOW: 'warning', OUT: 'danger' } as const;

/** Правка цены прямо в ячейке: Enter — сохранить, Esc — отменить. */
const PriceCell = ({ product, onSave }: { product: AdminProduct; onSave: (price: number) => void }) => {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(product.price));

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => {
          setValue(String(product.price));
          setEditing(true);
        }}
        className="w-full rounded-control px-2 py-1 text-right text-sm tabular-nums transition-colors hover:bg-raised"
        title="Изменить цену"
      >
        {money(product.price)}
      </button>
    );
  }

  const commit = () => {
    const next = Number.parseInt(value, 10);
    setEditing(false);
    if (Number.isFinite(next) && next >= 0 && next !== product.price) onSave(next);
  };

  return (
    <input
      autoFocus
      inputMode="numeric"
      value={value}
      onChange={(event) => setValue(event.target.value.replace(/\D/g, ''))}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === 'Enter') commit();
        if (event.key === 'Escape') setEditing(false);
      }}
      className="w-full rounded-control border border-accent bg-surface px-2 py-1 text-right text-sm tabular-nums outline-none"
    />
  );
};

export const ProductsPage = () => {
  const [params, setParams] = useSearchParams();
  const queryClient = useQueryClient();
  const workspace = useWorkspace((state) => state.workspace);
  const patchWorkspace = useWorkspace((state) => state.patchWorkspace);

  const [selected, setSelected] = useState<string[]>([]);
  const [viewName, setViewName] = useState('');

  const filters = {
    search: params.get('search') ?? '',
    category: params.get('category') ?? '',
    type: params.get('type') ?? '',
    status: params.get('status') ?? '',
  };

  const { data, isPending } = useQuery({
    queryKey: keys.products(filters),
    queryFn: () => api.products({ ...filters, limit: 200 }),
  });

  const { data: categories } = useQuery({ queryKey: keys.categories, queryFn: api.categories });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['products'] });
    void queryClient.invalidateQueries({ queryKey: keys.stats });
  };

  const bulk = useMutation({
    mutationFn: api.bulkProducts,
    onSuccess: (result) => {
      invalidate();
      toast.success(`Обновлено позиций: ${result.updated}`);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const columns = useMemo(
    () => allColumns.filter((column) => workspace.productColumns.includes(column.id) || column.locked),
    [workspace.productColumns],
  );

  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
    setSelected([]);
  };

  const applyView = (view: SavedView) => {
    const next = new URLSearchParams();
    for (const [key, value] of Object.entries(view.filters)) if (value) next.set(key, value);
    setParams(next, { replace: true });
    patchWorkspace({ productColumns: view.columns });
  };

  const saveView = () => {
    const name = viewName.trim();
    if (!name) return;
    const view: SavedView = {
      id: crypto.randomUUID(),
      name,
      filters,
      columns: workspace.productColumns,
    };
    patchWorkspace({ savedViews: [...workspace.savedViews, view] });
    setViewName('');
    toast.success(`Представление «${name}» сохранено`);
  };

  const items = data?.items ?? [];
  const allSelected = items.length > 0 && selected.length === items.length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Товары</h1>
          <p className="text-2xs text-muted">
            {data ? `${data.total} позиций в каталоге` : 'Загружаем каталог'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link to="/products/new?type=BUNDLE">Новый набор</Link>
          </Button>
          <Button asChild variant="primary" data-testid="new-product">
            <Link to="/products/new">
              <Plus size={15} /> Новый товар
            </Link>
          </Button>
        </div>
      </div>

      {/* Панель фильтров + сохранённые представления */}
      <div className="panel flex flex-wrap items-center gap-2 p-3">
        <div className="relative min-w-52 flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
          <Input
            value={filters.search}
            onChange={(event) => setFilter('search', event.target.value)}
            placeholder="Название или адрес страницы"
            className="pl-8"
            data-testid="product-search"
          />
        </div>

        <Select
          value={filters.category}
          onChange={(event) => setFilter('category', event.target.value)}
          className="w-auto"
        >
          <option value="">Все категории</option>
          {categories?.map((category) => (
            <option key={category.id} value={category.slug}>
              {category.nameRu}
            </option>
          ))}
        </Select>

        <Select
          value={filters.type}
          onChange={(event) => setFilter('type', event.target.value)}
          className="w-auto"
        >
          <option value="">Все виды</option>
          <option value="SIMPLE">Заготовки</option>
          <option value="BUNDLE">Наборы</option>
        </Select>

        <Select
          value={filters.status}
          onChange={(event) => setFilter('status', event.target.value)}
          className="w-auto"
        >
          <option value="">Любой статус</option>
          <option value="active">На витрине</option>
          <option value="hidden">Скрытые</option>
          <option value="out">Нет в наличии</option>
        </Select>

        {/* Выбор колонок */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <Button variant="outline" size="icon" title="Колонки">
              <Columns3 size={15} />
            </Button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content align="end" sideOffset={6} className="panel z-50 w-52 p-2">
              <DropdownMenu.Label className="label-caps px-2 py-1">Колонки</DropdownMenu.Label>
              {allColumns.map((column) => {
                const active = workspace.productColumns.includes(column.id);
                return (
                  <DropdownMenu.Item
                    key={column.id}
                    disabled={column.locked}
                    onSelect={(event) => {
                      event.preventDefault();
                      patchWorkspace({
                        productColumns: active
                          ? workspace.productColumns.filter((id) => id !== column.id)
                          : [...workspace.productColumns, column.id],
                      });
                    }}
                    className="flex cursor-pointer items-center justify-between rounded-control px-2 py-1.5 text-sm outline-none data-[disabled]:opacity-40 data-[highlighted]:bg-raised"
                  >
                    {column.label}
                    {(active || column.locked) && <Check size={14} className="text-accent" />}
                  </DropdownMenu.Item>
                );
              })}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <Button variant="outline" size="icon" title="Сохранённые представления">
              <Bookmark size={15} />
            </Button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content align="end" sideOffset={6} className="panel z-50 w-64 p-2">
              <DropdownMenu.Label className="label-caps px-2 py-1">
                Представления
              </DropdownMenu.Label>

              {workspace.savedViews.length === 0 && (
                <p className="px-2 py-2 text-2xs text-faint">
                  Настройте фильтры и колонки, затем сохраните набор под именем
                </p>
              )}

              {workspace.savedViews.map((view) => (
                <div
                  key={view.id}
                  className="flex items-center gap-1 rounded-control px-2 py-1.5 hover:bg-raised"
                >
                  <button
                    type="button"
                    onClick={() => applyView(view)}
                    className="flex-1 text-left text-sm"
                  >
                    {view.name}
                  </button>
                  <button
                    type="button"
                    aria-label="Удалить представление"
                    onClick={() =>
                      patchWorkspace({
                        savedViews: workspace.savedViews.filter((item) => item.id !== view.id),
                      })
                    }
                    className="text-faint hover:text-danger"
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}

              <div className="mt-2 flex gap-1 border-t border-line pt-2">
                <Input
                  value={viewName}
                  onChange={(event) => setViewName(event.target.value)}
                  onKeyDown={(event) => event.key === 'Enter' && saveView()}
                  placeholder="Название"
                  className="h-8 text-sm"
                />
                <Button size="sm" variant="primary" onClick={saveView}>
                  Сохранить
                </Button>
              </div>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>

      {/* Массовые действия по выделенным строкам */}
      {selected.length > 0 && (
        <div className="panel flex flex-wrap items-center gap-2 border-accent bg-accent-soft p-3">
          <span className="text-sm font-semibold">Выбрано: {selected.length}</span>
          <div className="ml-auto flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() => bulk.mutate({ ids: selected, patch: { isActive: true } })}
            >
              Показать на витрине
            </Button>
            <Button
              size="sm"
              onClick={() => bulk.mutate({ ids: selected, patch: { isActive: false } })}
            >
              Скрыть
            </Button>
            <Button
              size="sm"
              onClick={() => bulk.mutate({ ids: selected, patch: { stockStatus: 'OUT' } })}
            >
              Нет в наличии
            </Button>
            <Button
              size="sm"
              onClick={() => bulk.mutate({ ids: selected, patch: { stockStatus: 'IN_STOCK' } })}
            >
              Есть в наличии
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelected([])}>
              Снять выделение
            </Button>
          </div>
        </div>
      )}

      <div className="panel overflow-x-auto">
        {isPending ? (
          <Spinner />
        ) : items.length === 0 ? (
          <EmptyState
            title="Ничего не нашлось"
            hint="Измените фильтры или создайте первый товар"
            action={
              <Button asChild variant="primary" className="mt-2">
                <Link to="/products/new">Новый товар</Link>
              </Button>
            }
          />
        ) : (
          <table className="w-full min-w-[52rem] border-collapse" data-testid="products-table">
            <thead>
              <tr className="border-b border-line text-left">
                <th className="cell w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={() => setSelected(allSelected ? [] : items.map((item) => item.id))}
                    aria-label="Выбрать все"
                  />
                </th>
                {columns.map((column) => (
                  <th
                    key={column.id}
                    className={cn(
                      'cell label-caps font-semibold',
                      (column.id === 'price' || column.id === 'weight') && 'text-right',
                    )}
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {items.map((product) => (
                <tr
                  key={product.id}
                  className={cn(
                    'border-b border-line last:border-0 transition-colors hover:bg-raised',
                    selected.includes(product.id) && 'bg-accent-soft',
                    !product.isActive && 'opacity-60',
                  )}
                >
                  <td className="cell">
                    <input
                      type="checkbox"
                      checked={selected.includes(product.id)}
                      onChange={() =>
                        setSelected((current) =>
                          current.includes(product.id)
                            ? current.filter((id) => id !== product.id)
                            : [...current, product.id],
                        )
                      }
                      aria-label={product.name.ru}
                    />
                  </td>

                  {columns.map((column) => {
                    switch (column.id) {
                      case 'photo':
                        return (
                          <td key="photo" className="cell w-14">
                            {product.image ? (
                              <img
                                src={product.image.url}
                                alt=""
                                className="h-9 w-8 rounded object-cover"
                              />
                            ) : (
                              <span
                                className="grid h-9 w-8 place-items-center rounded border border-dashed border-line-strong text-2xs text-faint"
                                title="Фото не загружено"
                              >
                                —
                              </span>
                            )}
                          </td>
                        );

                      case 'name':
                        return (
                          <td key="name" className="cell">
                            <Link
                              to={`/products/${product.id}`}
                              className="font-medium hover:text-accent"
                            >
                              {product.name.ru}
                            </Link>
                            <div className="flex items-center gap-1.5 text-2xs text-faint">
                              {product.type === 'BUNDLE' && <Chip tone="accent">Набор</Chip>}
                              <span className="truncate">/{product.slug}</span>
                            </div>
                          </td>
                        );

                      case 'category':
                        return (
                          <td key="category" className="cell text-sm text-muted">
                            {product.category?.name.ru ?? '—'}
                          </td>
                        );

                      case 'price':
                        return (
                          <td key="price" className="cell w-32 text-right">
                            <PriceCell
                              product={product}
                              onSave={(price) =>
                                bulk.mutate({ ids: [product.id], patch: { price } })
                              }
                            />
                          </td>
                        );

                      case 'weight':
                        return (
                          <td key="weight" className="cell text-right text-sm tabular-nums text-muted">
                            {weight(product.weight.value, product.weight.unit)}
                          </td>
                        );

                      case 'stock':
                        return (
                          <td key="stock" className="cell">
                            <Select
                              value={product.stockStatus}
                              onChange={(event) =>
                                bulk.mutate({
                                  ids: [product.id],
                                  patch: { stockStatus: event.target.value },
                                })
                              }
                              className="h-7 w-auto border-transparent bg-transparent px-1 py-0 text-2xs"
                              aria-label="Наличие"
                            >
                              {Object.entries(stockLabels).map(([value, label]) => (
                                <option key={value} value={value}>
                                  {label}
                                </option>
                              ))}
                            </Select>
                            <span className="sr-only">
                              {stockTones[product.stockStatus as keyof typeof stockTones]}
                            </span>
                          </td>
                        );

                      case 'visible':
                        return (
                          <td key="visible" className="cell">
                            <button
                              type="button"
                              onClick={() =>
                                bulk.mutate({
                                  ids: [product.id],
                                  patch: { isActive: !product.isActive },
                                })
                              }
                              className="text-left"
                            >
                              <Chip tone={product.isActive ? 'success' : 'neutral'}>
                                {product.isActive ? 'Показан' : 'Скрыт'}
                              </Chip>
                            </button>
                          </td>
                        );

                      default:
                        return null;
                    }
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
