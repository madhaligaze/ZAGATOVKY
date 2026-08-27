import { useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Minus, Plus } from 'lucide-react';
import { api, queryKeys } from '@/lib/api';
import { ProductMedia } from '@/components/catalog/ProductMedia';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PageState } from '@/components/ui/PageState';
import { useLocale } from '@/hooks/useLocale';
import { useSeo } from '@/hooks/useSeo';
import { productJsonLd } from '@/lib/jsonld';
import { useCart, selectQtyOf } from '@/store/cart';
import { flyToCart } from '@/lib/motion';
import { formatPrice, formatWeight, pick, pricePerHundred } from '@/lib/format';
import { cn } from '@/lib/cn';

export const ProductPage = () => {
  const { slug = '' } = useParams();
  const { t, locale } = useLocale();
  const mediaRef = useRef<HTMLDivElement>(null);
  const [activeImage, setActiveImage] = useState(0);

  const { data: product, isPending, isError, refetch } = useQuery({
    queryKey: queryKeys.product(slug),
    queryFn: () => api.product(slug),
    enabled: Boolean(slug),
  });

  const add = useCart((state) => state.add);
  const setQty = useCart((state) => state.setQty);
  const openCart = useCart((state) => state.open);
  const qty = useCart(selectQtyOf(product?.id ?? ''));

  /*
   * Мета-теги ставим до ранних возвратов — правило хуков. Пока товар грузится,
   * значения запасные; как только пришёл — заголовок и разметка обновляются.
   *
   * Заголовок берём из поля SEO, если владелец его заполнил, иначе собираем
   * из названия и веса: «Свекла 250 г — заготовка с доставкой в Алматы» лучше
   * ловит запрос, чем одно название.
   */
  const seoName = product ? pick(product.name, locale) : '';
  const seoTitle = product
    ? pick(product.seoTitle, locale) ||
      `${seoName}, ${formatWeight(product.weight, locale)} — заготовка с доставкой в Алматы`
    : 'ZAGATOVKY';
  const seoDescription = product
    ? pick(product.seoDescription, locale) ||
      pick(product.description, locale) ||
      pick(product.short, locale)
    : null;

  useSeo({
    title: seoTitle,
    description: seoDescription,
    path: `/product/${slug}`,
    image: product?.image?.url ?? null,
    type: 'product',
    jsonLd: product ? productJsonLd(product, locale, window.location.origin) : undefined,
  });

  if (isPending) return <PageState />;
  if (isError || !product) {
    return (
      <div className="grid min-h-[60vh] place-items-center px-6 text-center">
        <div className="flex flex-col items-center gap-4">
          <span className="h-px w-10 bg-honey" />
          <p className="font-editorial text-heading-sm">{t('product.notFound')}</p>
          <Button asChild className="mt-2">
            <Link to="/catalog">{t('product.backToCatalog')}</Link>
          </Button>
          <button onClick={() => void refetch()} className="text-body-sm text-stone underline">
            {t('common.retry')}
          </button>
        </div>
      </div>
    );
  }

  const name = pick(product.name, locale);
  const perHundred = pricePerHundred(product.price, product.weight);
  const savings =
    product.componentsTotal !== null ? product.componentsTotal - product.price : null;

  const handleAdd = () => {
    add(product);
    const target = document.getElementById('cart-button');
    if (mediaRef.current && target) flyToCart(mediaRef.current, target);
  };

  return (
    <>
      <div className="border-b border-hairline bg-parchment">
        <div className="container-page py-4">
          <Link
            to="/catalog"
            className="inline-flex items-center gap-2 text-caption uppercase tracking-[0.125em] text-stone hover:text-mountain"
          >
            <ArrowLeft size={14} strokeWidth={1.75} />
            {t('product.backToCatalog')}
          </Link>
        </div>
      </div>

      <section className="band-snow pb-20 pt-10">
        <div className="container-page grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="flex flex-col gap-4">
            <ProductMedia
              ref={mediaRef}
              image={product.images[activeImage] ?? product.image}
              name={name}
              size="detail"
              className="aspect-[4/5] w-full border border-hairline"
            />

            {product.images.length > 1 && (
              <div className="flex gap-3">
                {product.images.map((image, index) => (
                  <button
                    key={image.id}
                    type="button"
                    onClick={() => setActiveImage(index)}
                    aria-label={`${name} — ${index + 1}`}
                    className={cn(
                      'h-20 w-16 overflow-hidden border transition-colors',
                      index === activeImage ? 'border-teal' : 'border-hairline hover:border-stone',
                    )}
                  >
                    <img src={image.url} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col">
            {product.badges.length > 0 && (
              <div className="mb-5 flex flex-wrap gap-2">
                {product.badges.map((badge) => (
                  <Badge key={badge.code} tone={badge.tone}>
                    {pick(badge.label, locale)}
                  </Badge>
                ))}
              </div>
            )}

            <h1 className="font-editorial text-display leading-[1.05]">{name}</h1>

            {pick(product.short, locale) && (
              <p className="mt-4 text-lead text-stone">{pick(product.short, locale)}</p>
            )}

            <div className="mt-8 flex items-end gap-4 border-y border-hairline py-6">
              <div>
                {product.compareAtPrice && (
                  <span className="block text-body-sm text-stone line-through">
                    {formatPrice(product.compareAtPrice, locale)}
                  </span>
                )}
                <span className="font-editorial text-heading-lg">
                  {formatPrice(product.price, locale)}
                </span>
              </div>
              <div className="mb-1 flex flex-col text-caption uppercase tracking-[0.125em] text-stone">
                <span>{formatWeight(product.weight, locale)}</span>
                {perHundred && (
                  <span>{t('product.perHundred', { price: formatPrice(perHundred, locale) })}</span>
                )}
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              {qty > 0 ? (
                <>
                  <div className="flex items-center rounded-pill border border-teal/40">
                    <button
                      type="button"
                      onClick={() => setQty(product.id, qty - 1)}
                      aria-label={t('cart.remove')}
                      className="grid h-14 w-14 place-items-center rounded-pill hover:bg-parchment"
                    >
                      <Minus size={18} strokeWidth={1.5} />
                    </button>
                    <span className="min-w-10 text-center text-subheading font-semibold tabular-nums">
                      {qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQty(product.id, qty + 1)}
                      aria-label={t('product.addToCart')}
                      className="grid h-14 w-14 place-items-center rounded-pill hover:bg-parchment"
                    >
                      <Plus size={18} strokeWidth={1.5} />
                    </button>
                  </div>
                  <Button variant="solid" size="lg" onClick={openCart}>
                    {t('cart.title')}
                  </Button>
                </>
              ) : (
                <Button
                  variant="solid"
                  size="lg"
                  onClick={handleAdd}
                  disabled={product.stockStatus === 'OUT'}
                  data-testid="add-to-cart"
                >
                  {product.stockStatus === 'OUT'
                    ? t('product.outOfStock')
                    : t('product.addToCart')}
                </Button>
              )}
            </div>

            {pick(product.description, locale) && (
              <div className="mt-10">
                <p className="eyebrow text-stone">{t('product.description')}</p>
                <p className="mt-3 text-body text-mountain/80">
                  {pick(product.description, locale)}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Состав набора — ключевой экран для комбо: видно, из чего собран и в чём выгода */}
      {product.bundleItems.length > 0 && (
        <section className="band band-parchment">
          <div className="container-page">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="eyebrow gold-rule text-stone">{t('product.compositionNote')}</p>
                <h2 className="font-editorial mt-4 text-heading-lg">{t('product.composition')}</h2>
              </div>

              {savings !== null && savings > 0 && (
                <div className="text-left md:text-right">
                  <p className="text-caption uppercase tracking-[0.125em] text-stone">
                    {t('product.separately')}:{' '}
                    <span className="line-through">
                      {formatPrice(product.componentsTotal ?? 0, locale)}
                    </span>
                  </p>
                  <p className="font-editorial mt-1 text-heading-sm text-teal">
                    {t('product.savings', { amount: formatPrice(savings, locale) })}
                  </p>
                </div>
              )}
            </div>

            <ul className="mt-10 grid gap-px border border-hairline bg-[color:var(--color-hairline)] sm:grid-cols-2 lg:grid-cols-4">
              {product.bundleItems.map((item) => (
                <li key={item.product.id} className="bg-parchment">
                  <Link
                    to={`/product/${item.product.slug}`}
                    className="flex h-full items-center gap-4 p-5 transition-colors hover:bg-snow"
                  >
                    <ProductMedia
                      image={item.product.image}
                      name={pick(item.product.name, locale)}
                      className="h-20 w-16 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-body-sm font-semibold">
                        {pick(item.product.name, locale)}
                      </p>
                      <p className="mt-1 text-caption uppercase tracking-[0.125em] text-stone">
                        {formatWeight(item.product.weight, locale)}
                        {item.qty > 1 && ` × ${item.qty}`}
                      </p>
                      <p className="mt-2 text-body-sm">
                        {formatPrice(item.product.price, locale)}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  );
};
