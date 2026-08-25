import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * tailwind-merge знает только дефолтную шкалу Tailwind. Наши токены из @theme
 * для него — незнакомые классы, и `text-mountain` рядом с `text-body-sm`
 * он принимал за два размера шрифта, вычёркивая цвет. Поэтому кастомные
 * значения перечислены явно и разложены по правильным группам.
 */
const fontSizes = [
  'caption',
  'body-sm',
  'body',
  'lead',
  'subheading',
  'heading-sm',
  'heading',
  'heading-lg',
  'display',
  'display-lg',
];

const colors = [
  'mountain',
  'teal',
  'honey',
  'parchment',
  'parchment-deep',
  'stone',
  'stone-light',
  'charcoal',
  'snow',
  'hairline',
  'hairline-strong',
  'hairline-light',
];

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: fontSizes }],
      'text-color': [{ text: colors }],
      'bg-color': [{ bg: colors }],
      'border-color': [{ border: colors }],
      rounded: [{ rounded: ['card', 'pill'] }],
    },
  },
});

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
