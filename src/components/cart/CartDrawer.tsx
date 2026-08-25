import { useEffect, useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, Undo2, X } from 'lucide-react';
import { useCart, selectSubtotal, selectCount, type CartItem } from '@/store/cart';
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
  const remove = useCart((state) => state.remove);
  const add = useCart((state) => state.add);
  const clear = useCart((state) => state.clear);

  /**
   * Удаление позиции с возможностью откатить. Без этого единственным способом
   * убрать товар был минус до нуля — неочевидно, и промах не отменить.
   */
  const [undoItem, setUndoItem] = useState<CartItem | null>(null);
  const undoTimer = useRef<number | null>(null);

  useEffect(() => () => {
    if (undoTimer.current) window.clearTimeout(undoTimer.current);
  }, []);

  const removeItem = (item: CartItem) => {
    remove(item.product.id);
    setUndoItem(item);
    if (undoTimer.current) window.clearTimeout(undoTimer.current);
    undoTimer.current = window.setTimeout(() => setUndoItem(null), 7000);
  };

  const undoRemove = () => {
    if (!undoItem) return;
    add(undoItem.product, undoItem.qty);
    setUndoItem(null);
    if (undoTimer.current) window.clearTimeout(undoTimer.current);
  };
  const subtotal = useCart(selectSubtotal);
  const count = useCart(selectCount);

  /*
   * Полоса «до бесплатной доставки» имеет смысл, только если доставка вообще
   * платная. При baseFee = 0 корзина звала добрать до порога, а на оформлении
   * тут же стояло «Доставка — бесплатно»: два разных обещания в одной воронке.
   */
  const freeFrom =
    settings && settings.delivery.baseFee > 0 ? settings.delivery.freeFrom : null;
  const remainingToFree = freeFrom === null ? 0 : Math.max(freeFrom - subtotal, 0);
  const progress = freeFrom === null ? 100 : Math.min((subtotal / freeFrom) * 100, 100);
  const belowMinimum = settings ? subtotal < settings.delivery.minOrder : false;

  /**
   * Полоска отката нужна и в пустой корзине: если убрали последнюю позицию,
   * ветка «корзина пуста» заменяет весь список — без этого вернуть товар
   * было бы уже нечем.
   */
  const undoStrip = undoItem && (
    <div
      data-testid="cart-undo"
      className="flex items-center gap-3 border-t border-hairline bg-parchment px-6 py-3"
    >
      <p className="min-w-0 flex-1 truncate text-caption text-stone">
        {t('cart.removed', { name: pick(undoItem.product.name, locale) })}
      </p>
      <button
        type="button"
        onClick={undoRemove}
        data-testid="cart-undo-button"
        className="flex shrink-0 items-center gap-1.5 text-caption uppercase tracking-[0.125em] text-mountain underline-offset-4 hover:underline"
      >
        <Undo2 size={14} strokeWidth={1.75} />
        {t('cart.undo')}
      </button>
    </div>
  );

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
            <>
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
              {undoStrip}
            </>
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
                {items.map((item) => {
                  const { product, qty } = item;
                  return (
                  <li key={product.id} className="flex gap-4 px-6 py-4">
                    <Link to={`/product/${product.slug}`} onClick={close} className="shrink-0">
                      <ProductMedia
                        image={product.image}
                        name={pick(product.name, locale)}
                        className="h-20 w-16"
                      />
                    </Link>

                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <div className="flex items-start gap-2">
                        <Link
                          to={`/product/${product.slug}`}
                          onClick={close}
                          className="min-w-0 flex-1 truncate text-body-sm font-semibold hover:text-teal"
                        >
                          {pick(product.name, locale)}
                        </Link>
                        {/* Явная кнопка удаления: 44px под палец, не прячется за минусом */}
                        <button
                          type="button"
                          onClick={() => removeItem(item)}
                          aria-label={t('cart.removeItem', { name: pick(product.name, locale) })}
                          data-testid={`remove-${product.slug}`}
                          className="-mr-2 -mt-2 grid h-9 w-9 shrink-0 place-items-center rounded-pill text-stone transition-colors hover:bg-parchment hover:text-mountain"
                        >
                          <Trash2 size={15} strokeWidth={1.5} />
                        </button>
                      </div>
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
                  );
                })}
              </ul>

              {undoStrip}

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
