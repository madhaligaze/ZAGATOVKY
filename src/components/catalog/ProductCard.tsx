import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ProductMedia } from './ProductMedia';
import { useTilt } from '@/hooks/useTilt';
import { useLocale } from '@/hooks/useLocale';
import { useCart, selectQtyOf } from '@/store/cart';
import { flyToCart } from '@/lib/motion';
import { formatPrice, formatWeight, pick } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { ProductCard as ProductCardData } from '@/types/catalog';

type Props = {
  product: ProductCardData;
  className?: string;
};

export const ProductCard = ({ product, className }: Props) => {
  const { t, locale } = useLocale();
  const tiltRef = useTilt<HTMLDivElement>(4);
  const mediaRef = useRef<HTMLDivElement>(null);

  const qty = useCart(selectQtyOf(product.id));
  const add = useCart((state) => state.add);
  const setQty = useCart((state) => state.setQty);

  const isOut = product.stockStatus === 'OUT';
  const name = pick(product.name, locale);

  const handleAdd = () => {
    add(product);
    const target = document.getElementById('cart-button');
    if (mediaRef.current && target) flyToCart(mediaRef.current, target);
  };

  return (
    <article
      // data-атрибут — якорь для Flip-анимации при смене фильтра каталога
      data-flip-id={product.id}
      className={cn(
        'group relative flex flex-col border border-hairline bg-snow',
        isOut && 'opacity-60',
        className,
      )}
    >
      <div ref={tiltRef} className="relative">
        <Link
          to={`/product/${product.slug}`}
          className="block focus-visible:outline-offset-[-3px]"
          aria-label={name}
        >
          <ProductMedia
            ref={mediaRef}
            image={product.image}
            name={name}
            className="aspect-[4/5] w-full"
            imageClassName="group-hover:scale-[1.06]"
          />
        </Link>

        {product.badges.length > 0 && (
          <div className="pointer-events-none absolute left-4 top-4 flex flex-wrap gap-2">
            {product.badges.slice(0, 2).map((badge) => (
              <Badge key={badge.code} tone={badge.tone} className="bg-snow/90 backdrop-blur-sm">
                {pick(badge.label, locale)}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 border-t border-hairline p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-subheading font-semibold leading-tight">
            <Link to={`/product/${product.slug}`} className="hover:text-teal">
              {name}
            </Link>
          </h3>
          <span className="shrink-0 text-caption uppercase tracking-[0.125em] text-stone">
            {formatWeight(product.weight, locale)}
          </span>
        </div>

        {pick(product.short, locale) && (
          <p className="text-body-sm text-stone">{pick(product.short, locale)}</p>
        )}

        <div className="mt-auto flex items-end justify-between gap-3 pt-2">
          <div className="flex flex-col">
            {product.compareAtPrice && (
              <span className="text-body-sm text-stone line-through">
                {formatPrice(product.compareAtPrice, locale)}
              </span>
            )}
            <span className="font-editorial text-heading-sm">
              {formatPrice(product.price, locale)}
            </span>
          </div>

          {isOut ? (
            <span className="pb-1 text-caption uppercase tracking-[0.125em] text-stone">
              {t('product.outOfStock')}
            </span>
          ) : qty > 0 ? (
            <div className="flex items-center gap-1 rounded-pill border border-teal/40">
              <button
                type="button"
                onClick={() => setQty(product.id, qty - 1)}
                aria-label={t('cart.remove')}
                className="grid h-10 w-10 place-items-center rounded-pill text-mountain hover:bg-parchment"
              >
                <Minus size={16} strokeWidth={1.75} />
              </button>
              <span className="min-w-6 text-center text-body-sm font-semibold tabular-nums">
                {qty}
              </span>
              <button
                type="button"
                onClick={() => setQty(product.id, qty + 1)}
                aria-label={t('product.addToCart')}
                className="grid h-10 w-10 place-items-center rounded-pill text-mountain hover:bg-parchment"
              >
                <Plus size={16} strokeWidth={1.75} />
              </button>
            </div>
          ) : (
            <Button size="sm" onClick={handleAdd} data-testid={`add-${product.slug}`}>
              {t('product.addToCart')}
            </Button>
          )}
        </div>
      </div>
    </article>
  );
};
