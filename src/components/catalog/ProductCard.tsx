import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ProductMedia } from './ProductMedia';
import { RevealFrame } from '@/components/fx/RevealFrame';
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
          {/* Кадр раскрывается при появлении в окне, содержимое внутри едет
              медленнее страницы. Приёму всё равно, фотография внутри или
              типографская заглушка — работает и до появления снимков. */}
          <RevealFrame className="aspect-[4/5] w-full" parallax={6}>
            <ProductMedia
              ref={mediaRef}
              image={product.image}
              name={name}
              className="h-full w-full"
              imageClassName="group-hover:scale-[1.06]"
            />
          </RevealFrame>
        </Link>

        {/* Правый край обязателен: без него пилюля растёт до края кадра и на
            узкой карточке упирается в него вплотную. Вторая отметка на телефоне
            прячется — вдвоём они закрывают верхнюю треть фотографии. */}
        {product.badges.length > 0 && (
          <div className="pointer-events-none absolute left-3 right-3 top-3 flex flex-wrap gap-2 sm:left-4 sm:right-4 sm:top-4">
            {product.badges.slice(0, 2).map((badge, index) => (
              <Badge
                key={badge.code}
                tone={badge.tone}
                /* На карточке в 134 px «Готовый набор» в системном кегле не
                   помещается в одну строку. Переносить пилюлю нельзя — капсула
                   рассчитана на строку, — поэтому на телефоне уменьшаем кегль
                   и трекинг, а с sm возвращаем системные. */
                className={cn(
                  'whitespace-nowrap bg-snow/90 px-2 text-[0.625rem] tracking-[0.1em] backdrop-blur-sm',
                  'sm:px-3 sm:text-caption sm:tracking-[0.125em]',
                  index === 1 && 'hidden sm:inline-flex',
                )}
              >
                {pick(badge.label, locale)}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Цена и кнопка встают друг под друга на телефоне — иначе строка не помещается. */}
      <div className="flex flex-1 flex-col gap-2 border-t border-hairline p-4 sm:gap-3 sm:p-5">
        {/* Мета — вторая строка, а не второй столбец. В строку она не влезает:
            при двухстрочном названии «650 г · на 4 порции» уезжала за край
            карточки на всех ширинах от 1024 px. */}
        <div className="flex flex-col gap-1">
          <h3 className="text-body font-semibold leading-tight sm:text-subheading">
            <Link
              to={`/product/${product.slug}`}
              title={name}
              className="line-clamp-2 hover:text-teal sm:line-clamp-3"
            >
              {name}
            </Link>
          </h3>
          {/* Вес без порций непонятен: «250 г свеклы» ничего не говорит о том,
              на сколько человек это. Порции есть не у всего — у масла и специй
              их не бывает, там остаётся один вес. */}
          <span className="text-caption uppercase tracking-[0.125em] text-stone">
            {formatWeight(product.weight, locale)}
            {product.portions !== null && (
              <span className="text-stone/75">
                {' · '}
                {t('product.portions', { count: product.portions })}
              </span>
            )}
          </span>
        </div>

        {/* На телефоне описание раньше пряталось совсем, и на его месте
            оставалась дыра в 36–74 px между весом и ценой. Одна строка
            заполняет её содержанием.

            Прячем через max-*:hidden, а не через hidden + min-*:block:
            line-clamp работает на display:-webkit-box, и любой block выше
            брейкпоинта его отменяет — обрезка молча перестаёт действовать. */}
        {pick(product.short, locale) && (
          <p className="line-clamp-1 text-body-sm text-stone max-[359px]:hidden sm:line-clamp-2">
            {pick(product.short, locale)}
          </p>
        )}

        <div className="mt-auto flex flex-col items-stretch gap-2 pt-2 sm:flex-row sm:items-end sm:justify-between sm:gap-3">
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
            <div className="flex items-center justify-between gap-1 rounded-pill border border-teal/40 sm:justify-start">
              <button
                type="button"
                onClick={() => setQty(product.id, qty - 1)}
                aria-label={t('cart.remove')}
                className="grid h-11 w-11 place-items-center rounded-pill text-mountain hover:bg-parchment"
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
                className="grid h-11 w-11 place-items-center rounded-pill text-mountain hover:bg-parchment"
              >
                <Plus size={16} strokeWidth={1.75} />
              </button>
            </div>
          ) : (
            <Button
              /* md, а не sm: sm даёт 40px по высоте, а это основная кнопка
                 покупки на телефоне — держим рекомендованные 44px. */
              size="md"
              onClick={handleAdd}
              data-testid={`add-${product.slug}`}
              className="w-full px-5 text-caption sm:w-auto"
            >
              {t('product.addToCart')}
            </Button>
          )}
        </div>
      </div>
    </article>
  );
};
