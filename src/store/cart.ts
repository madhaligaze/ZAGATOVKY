import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ProductCard } from '@/types/catalog';

/**
 * В корзине лежит снимок товара, а не только id: если позицию скроют из каталога,
 * пользователь всё равно увидит, что у него набрано. Итоговые цены при оформлении
 * всё равно пересчитывает сервер.
 */
export type CartItem = {
  product: ProductCard;
  qty: number;
};

type CartState = {
  items: CartItem[];
  isOpen: boolean;
  add: (product: ProductCard, qty?: number) => void;
  setQty: (productId: string, qty: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
  toggle: () => void;
};

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      isOpen: false,

      add: (product, qty = 1) =>
        set((state) => {
          const existing = state.items.find((item) => item.product.id === product.id);
          if (existing) {
            return {
              items: state.items.map((item) =>
                item.product.id === product.id
                  ? { ...item, qty: Math.min(item.qty + qty, 99), product }
                  : item,
              ),
            };
          }
          return { items: [...state.items, { product, qty }] };
        }),

      setQty: (productId, qty) =>
        set((state) => ({
          items:
            qty <= 0
              ? state.items.filter((item) => item.product.id !== productId)
              : state.items.map((item) =>
                  item.product.id === productId ? { ...item, qty: Math.min(qty, 99) } : item,
                ),
        })),

      remove: (productId) =>
        set((state) => ({ items: state.items.filter((item) => item.product.id !== productId) })),

      clear: () => set({ items: [] }),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set((state) => ({ isOpen: !state.isOpen })),
    }),
    {
      name: 'zagatovky:cart',
      // Открытость шторки — состояние сессии, между перезагрузками не переносим.
      partialize: (state) => ({ items: state.items }),
      version: 1,
    },
  ),
);

export const selectCount = (state: CartState) =>
  state.items.reduce((sum, item) => sum + item.qty, 0);

export const selectSubtotal = (state: CartState) =>
  state.items.reduce((sum, item) => sum + item.product.price * item.qty, 0);

export const selectQtyOf = (productId: string) => (state: CartState) =>
  state.items.find((item) => item.product.id === productId)?.qty ?? 0;
