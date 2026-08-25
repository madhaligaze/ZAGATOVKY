import type { Locale, LocalizedNullable, WeightUnit } from '@/types/catalog';

/** Цена всегда целая в тенге. Неразрывный пробел, чтобы «3 960 тг» не рвалось. */
export const formatPrice = (value: number, locale: Locale = 'ru') =>
  `${value.toLocaleString(locale === 'kk' ? 'kk-KZ' : 'ru-RU')} ${locale === 'kk' ? '₸' : 'тг'}`;

const unitLabels: Record<WeightUnit, { ru: string; kk: string }> = {
  G: { ru: 'г', kk: 'г' },
  ML: { ru: 'мл', kk: 'мл' },
  PORTION: { ru: 'порц.', kk: 'порц.' },
  PCS: { ru: 'шт.', kk: 'дана' },
};

export const formatWeight = (
  weight: { value: number; unit: WeightUnit },
  locale: Locale = 'ru',
) => `${weight.value} ${unitLabels[weight.unit][locale]}`;

/** Двуязычное поле → строка текущего языка с откатом на русский. */
export const pick = (field: LocalizedNullable | { ru: string; kk: string }, locale: Locale) =>
  (locale === 'kk' ? field.kk : field.ru) ?? field.ru ?? '';

/** Цена за 100 г — помогает сравнивать позиции разного веса. */
export const pricePerHundred = (price: number, weight: { value: number; unit: WeightUnit }) => {
  if (weight.unit !== 'G' || weight.value <= 0) return null;
  return Math.round((price / weight.value) * 100);
};
