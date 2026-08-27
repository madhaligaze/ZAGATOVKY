import { useEffect, useLayoutEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { api, queryKeys } from '@/lib/api';
import { ProductCard } from '@/components/catalog/ProductCard';
import { PageState } from '@/components/ui/PageState';
import { useLocale } from '@/hooks/useLocale';
import { useSeo } from '@/hooks/useSeo';
import { Flip, gsap, prefersReducedMotion } from '@/lib/motion';
import { ArrowUpDown } from 'lucide-react';
import { pick } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { ProductQuery } from '@/types/catalog';

const sorts = ['default', 'price_asc', 'price_desc', 'name', 'new'] as const;

export const CatalogPage = () => {
  const { t, locale } = useLocale();
  const [params, setParams] = useSearchParams();

  const category = params.get('category') ?? undefined;
  const type = (params.get('type') as ProductQuery['type']) ?? undefined;
  const sort = (params.get('sort') as ProductQuery['sort']) ?? 'default';

  const { data: categories } = useQuery({
    queryKey: queryKeys.categories,
    queryFn: api.categories,
    staleTime: 5 * 60 * 1000,
  });

  const query: ProductQuery = { category, type, sort };
  const { data, isPending, isError, refetch, isPlaceholderData } = useQuery({
    queryKey: queryKeys.products(query),
    queryFn: () => api.products(query),
    placeholderData: keepPreviousData,
  });

  /*
   * Canonical для каталога включает фильтр, но не сортировку: категория — это
   * действительно другая страница, а порядок карточек — та же самая. Без этого
   * пять вариантов сортировки выглядели бы для поисковика как пять дублей.
   */
  const activeCategory = (categories ?? []).find((item) => item.slug === category);
  const catalogTitle =
    type === 'BUNDLE'
      ? `${t('catalog.bundlesTitle')} — ${t('catalog.bundlesSubtitle')}`
      : activeCategory
        ? `${pick(activeCategory.name, locale)} — заготовки с доставкой в Алматы`
        : `${t('catalog.title')} — доставка в день нарезки, Алматы`;

  useSeo({
    title: catalogTitle,
    description:
      type === 'BUNDLE'
        ? t('catalog.bundlesSubtitle')
        : (activeCategory && pick(activeCategory.description, locale)) || t('catalog.subtitle'),
    path: type === 'BUNDLE' ? '/catalog?type=BUNDLE' : category ? `/catalog?category=${category}` : '/catalog',
  });

  const gridRef = useRef<HTMLDivElement>(null);
  const flipState = useRef<Flip.FlipState | null>(null);
  const items = data?.items ?? [];

  // Перед сменой фильтра снимаем позиции карточек…
  const captureLayout = () => {
    if (prefersReducedMotion() || !gridRef.current) return;
    flipState.current = Flip.getState(gridRef.current.querySelectorAll('[data-flip-id]'));
  };

  // …а после перерисовки сетки проигрываем перетекание в новые позиции.
  useLayoutEffect(() => {
    if (!flipState.current || !gridRef.current) return;

    Flip.from(flipState.current, {
      duration: 0.55,
      ease: 'power3.inOut',
      scale: true,
      absolute: true,
      stagger: 0.02,
      onEnter: (elements) =>
        gsap.fromTo(
          elements,
          { opacity: 0, scale: 0.94 },
          { opacity: 1, scale: 1, duration: 0.45, ease: 'power2.out', stagger: 0.02 },
        ),
      onLeave: (elements) =>
        gsap.to(elements, { opacity: 0, scale: 0.94, duration: 0.3, ease: 'power2.in' }),
    });

    flipState.current = null;
  }, [items]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [category, type]);

  /**
   * Меняем сразу все затронутые параметры одним вызовом. Раньше сброс типа и
   * установка категории шли двумя вызовами подряд, и второй перезатирал первый
   * старым состоянием — выбор категории не снимал фильтр «Наборы» и каталог
   * оказывался пустым.
   */
  const setParams_ = (patch: Record<string, string | undefined>) => {
    captureLayout();
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(patch)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    setParams(next, { replace: true });
  };

  // «Наборы» — такой же фильтр, как категория: без него переход из шапки
  // менял выдачу, но в рельсе ничего не подсвечивалось и клик выглядел пустым.
  const filters = [
    { key: 'all', label: t('common.all'), active: !category && !type, patch: {} },
    ...(categories ?? []).map((item) => ({
      key: item.slug,
      label: pick(item.name, locale),
      active: category === item.slug && !type,
      patch: { category: item.slug },
    })),
    {
      key: 'BUNDLE',
      label: t('nav.bundles'),
      active: type === 'BUNDLE',
      patch: { type: 'BUNDLE' },
    },
  ];

  return (
    <>
      <section className="band-parchment border-b border-hairline pb-12 pt-16">
        <div className="container-page">
          {/* Заголовок меняется вместе с фильтром: переход «Наборы» из шапки
              должен читаться сразу, а не только по составу сетки. */}
          <p className="eyebrow gold-rule text-stone">
            {type === 'BUNDLE' ? t('nav.bundles') : t('nav.catalog')}
          </p>
          <h1 className="font-editorial mt-4 text-display" data-testid="catalog-title">
            {type === 'BUNDLE' ? t('catalog.bundlesTitle') : t('catalog.title')}
          </h1>
          <p className="mt-4 max-w-xl text-lead text-mountain/70">
            {type === 'BUNDLE' ? t('catalog.bundlesSubtitle') : t('catalog.subtitle')}
          </p>
        </div>
      </section>

      {/* Липкий рельс фильтров — остаётся под шапкой при прокрутке каталога.
          На телефоне категории не переносятся на вторую строку, а прокручиваются
          вбок: иначе рельс занимал бы треть экрана и оттеснял сами товары. */}
      {/* overflow-x-clip обязателен для Safari. Сама лента ниже прокручивается
          корректно (её ширина равна экрану), но WebKit поднимает содержимое
          скролл-контейнера в scrollWidth предков — и вбок уезжала вся страница
          каталога: 449px при экране 390px. Chromium так не делает, поэтому баг
          виден только на iPhone. clip, а не hidden: не создаёт лишний скролл-бокс
          и не мешает sticky у этого же элемента. */}
      <div className="sticky top-18 z-40 overflow-x-clip border-b border-hairline bg-snow/95 backdrop-blur-md">
        <div className="container-page flex items-center gap-2 py-3 lg:py-4">
          {/* Затухание у правого края: обрезанная пилюля так читается как
              «список продолжается», а не как сломанная вёрстка. */}
          {/* min-w-0: у флекс-элемента min-width по умолчанию auto, из-за чего
              лента не сжимается ниже суммарной ширины пилюль. */}
          <div className="-mx-[var(--spacing-gutter)] flex min-w-0 flex-1 gap-2 overflow-x-auto px-[var(--spacing-gutter)] [mask-image:linear-gradient(to_right,black_calc(100%-2.5rem),transparent)] [scrollbar-width:none] lg:mx-0 lg:flex-wrap lg:px-0 lg:[mask-image:none] [&::-webkit-scrollbar]:hidden">
            {filters.map((filter) => (
              <button
                key={filter.key}
                type="button"
                // Каждый фильтр сбрасывает оба параметра и выставляет только свой —
                // категория и «Наборы» взаимоисключающие.
                onClick={() =>
                  setParams_({ category: undefined, type: undefined, ...filter.patch })
                }
                data-testid={`filter-${filter.key}`}
                className={cn(
                  'shrink-0 rounded-pill border px-4 py-2 text-caption uppercase tracking-[0.125em] transition-colors',
                  filter.active
                    ? 'border-mountain bg-mountain text-parchment'
                    : 'border-hairline text-mountain hover:border-teal hover:bg-parchment',
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* На телефоне сортировка сжата до иконки: подпись «По умолчанию»
              занимала половину строки и не давала листать категории.
              Сам select остаётся настоящим — открывается родной выбор системы. */}
          <div className="relative shrink-0">
            <span className="pointer-events-none flex h-10 w-10 items-center justify-center rounded-pill border border-hairline text-mountain lg:hidden">
              <ArrowUpDown size={15} strokeWidth={1.75} />
            </span>

            <select
              value={sort}
              onChange={(event) => setParams_({ sort: event.target.value })}
              aria-label={t('catalog.sort.label')}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0 lg:relative lg:h-auto lg:w-auto lg:rounded-pill lg:border lg:border-hairline lg:bg-transparent lg:px-4 lg:py-2 lg:text-caption lg:uppercase lg:tracking-[0.125em] lg:text-mountain lg:opacity-100 lg:hover:border-teal"
            >
              {sorts.map((value) => (
                <option key={value} value={value}>
                  {t(`catalog.sort.${value}`)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <section className="band band-snow pt-12">
        <div className="container-page">
          {isPending ? (
            <PageState />
          ) : isError ? (
            <PageState isError onRetry={() => void refetch()} />
          ) : items.length === 0 ? (
            <PageState title={t('catalog.empty')} hint={t('catalog.emptyHint')} />
          ) : (
            <>
              <p className="mb-8 text-caption uppercase tracking-[0.125em] text-stone">
                {t('catalog.found_many', { count: data.total })}
              </p>
              <div
                ref={gridRef}
                data-testid="product-grid"
                className={cn(
                  'grid grid-cols-2 gap-3 transition-opacity sm:gap-6 lg:grid-cols-3 xl:grid-cols-4',
                  isPlaceholderData && 'opacity-60',
                )}
              >
                {items.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
};
