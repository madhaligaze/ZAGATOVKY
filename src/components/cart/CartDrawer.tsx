import * as Dialog from '@radix-ui/react-dialog';
import { Link } from 'react-router-dom';
import { Minus, Plus, X } from 'lucide-react';
import { useCart, selectSubtotal, selectCount } from '@/store/cart';
import { useLocale } from '@/hooks/useLocale';
import { usePublicSettings } from '@/hooks/usePublicSettings';
import { ProductMedia } from '@/components/catalog/ProductMedia';
import { Button } from '@/components/ui/Button';
import { formatPrice, formatWeight, pick } from '@/lib/format';

export const CartDrawer = () => {
  const { t, locale } = useLocale();
  const { data: settings } = usePublicSettings();

  const isOpen = useCart((state) => state.isOpen);
  const close = useCart((state) => state.close);
  const items = useCart((state) => state.items);
  const setQty = useCart((state) => state.setQty);
  const clear = useCart((state) => state.clear);
  const subtotal = useCart(selectSubtotal);
  const count = useCart(selectCount);

  const freeFrom = settings?.delivery.freeFrom ?? null;
  const remainingToFree = freeFrom === null ? 0 : Math.max(freeFrom - subtotal, 0);
  const progress = freeFrom === null ? 100 : Math.min((subtotal / freeFrom) * 100, 100);
  const belowMinimum = settings ? subtotal < settings.delivery.minOrder : false;

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && close()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-60 bg-mountain/40 backdrop-blur-[2px] data-[state=open]:animate-[fade-in_200ms_ease-out]" />
        <Dialog.Content
          data-testid="cart-drawer"
          className="fixed right-0 top-0 z-60 flex h-dvh w-full max-w-[27rem] flex-col bg-snow shadow-none data-[state=open]:animate-[slide-in_320ms_cubic-bezier(0.22,1,0.36,1)]"
        >
          <div className="flex items-center justify-between border-b border-hairline px-6 py-5">
            <Dialog.Title className="font-editorial text-heading-sm">
              {t('cart.title')}
              {count > 0 && <span className="ml-2 text-body-sm text-stone">({count})</span>}
            </Dialog.Title>
            <Dialog.Close
              aria-label={t('nav.close')}
              className="grid h-10 w-10 place-items-center rounded-pill border border-hairline hover:bg-parchment"
            >
              <X size={18} strokeWidth={1.5} />
            </Dialog.Close>
          </div>

          {items.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
              <span className="h-px w-10 bg-honey" />
              <p className="font-editorial text-heading-sm">{t('cart.empty')}</p>
              <p className="text-body-sm text-stone">{t('cart.emptyHint')}</p>
              <Button asChild className="mt-2">
                <Link to="/catalog" onClick={close}>
                  {t('cart.goToCatalog')}
                </Link>
              </Button>
            </div>
          ) : (
            <>
              {/* Прогресс до бесплатной доставки — мягкий стимул добрать корзину */}
              {freeFrom !== null && (
                <div className="border-b border-hairline bg-parchment px-6 py-4">
                  <p className="mb-2 text-caption uppercase tracking-[0.125em]">
                    {remainingToFree > 0
                      ? t('cart.freeDeliveryProgress', {
                          amount: formatPrice(remainingToFree, locale),
                        })
                      : t('cart.freeDeliveryReached')}
                  </p>
                  <div className="h-1 w-full overflow-hidden rounded-pill bg-mountain/15">
                    <div
                      className="h-full rounded-pill bg-honey transition-[width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              <ul className="flex-1 divide-y divide-[color:var(--color-hairline)] overflow-y-auto">
                {items.map(({ product, qty }) => (
                  <li key={product.id} className="flex gap-4 px-6 py-4">
                    <Link to={`/product/${product.slug}`} onClick={close} className="shrink-0">
                      <ProductMedia
                        image={product.image}
                        name={pick(product.name, locale)}
                        className="h-20 w-16"
                      />
                    </Link>

                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <Link
                        to={`/product/${product.slug}`}
                        onClick={close}
                        className="truncate text-body-sm font-semibold hover:text-teal"
                      >
                        {pick(product.name, locale)}
                      </Link>
                      <span className="text-caption uppercase tracking-[0.125em] text-stone">
                        {formatWeight(product.weight, locale)}
                      </span>

                      <div className="mt-auto flex items-center justify-between gap-2">
                        <div className="flex items-center rounded-pill border border-hairline">
                          <button
                            type="button"
                            onClick={() => setQty(product.id, qty - 1)}
                            aria-label={t('cart.remove')}
                            className="grid h-8 w-8 place-items-center rounded-pill hover:bg-parchment"
                          >
                            <Minus size={14} strokeWidth={1.75} />
                          </button>
                          <span className="min-w-6 text-center text-body-sm tabular-nums">
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => setQty(product.id, qty + 1)}
                            aria-label={t('product.addToCart')}
                            className="grid h-8 w-8 place-items-center rounded-pill hover:bg-parchment"
                          >
                            <Plus size={14} strokeWidth={1.75} />
                          </button>
                        </div>
                        <span className="text-body-sm font-semibold tabular-nums">
                          {formatPrice(product.price * qty, locale)}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="border-t border-hairline px-6 py-5">
                <div className="mb-4 flex items-baseline justify-between">
                  <span className="text-caption uppercase tracking-[0.125em] text-stone">
                    {t('cart.subtotal')}
                  </span>
                  <span
                    data-testid="cart-subtotal"
                    className="font-editorial text-heading-sm tabular-nums"
                  >
                    {formatPrice(subtotal, locale)}
                  </span>
                </div>

                {belowMinimum && settings && (
                  <p className="mb-3 text-body-sm text-stone">
                    {t('cart.minOrder', {
                      amount: formatPrice(settings.delivery.minOrder, locale),
                    })}
                  </p>
                )}

                <Button asChild variant="solid" size="lg" className="w-full">
                  <Link to="/checkout" onClick={close} data-testid="go-checkout">
                    {t('cart.checkout')}
                  </Link>
                </Button>

                <button
                  type="button"
                  onClick={clear}
                  className="mt-3 w-full text-caption uppercase tracking-[0.125em] text-stone hover:text-mountain"
                >
                  {t('cart.clear')}
                </button>
              </div>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
