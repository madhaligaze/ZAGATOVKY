import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Черновик формы заказа. Живёт отдельно от корзины, потому что переживает уход
 * в каталог за добавкой: заполнил имя и адрес, вернулся дозаказать — данные на месте.
 * Очищается только после успешного оформления.
 */
export type CheckoutDraft = {
  customerName: string;
  /** Десять национальных цифр без кода страны — маска рисуется при показе */
  phoneDigits: string;
  address: string;
  comment: string;
  channel: 'WHATSAPP' | 'TELEGRAM';
  deliveryType: 'DELIVERY' | 'PICKUP';
  customerType: 'PERSON' | 'BUSINESS';
};

const empty: CheckoutDraft = {
  customerName: '',
  phoneDigits: '',
  address: '',
  comment: '',
  channel: 'WHATSAPP',
  deliveryType: 'DELIVERY',
  customerType: 'PERSON',
};

type CheckoutState = CheckoutDraft & {
  set: (patch: Partial<CheckoutDraft>) => void;
  reset: () => void;
};

export const useCheckoutDraft = create<CheckoutState>()(
  persist(
    (set) => ({
      ...empty,
      set: (patch) => set(patch),
      reset: () => set(empty),
    }),
    {
      name: 'zagatovky:checkout',
      version: 1,
    },
  ),
);

export const isDraftFilled = (draft: CheckoutDraft) =>
  Boolean(draft.customerName || draft.phoneDigits || draft.address || draft.comment);
