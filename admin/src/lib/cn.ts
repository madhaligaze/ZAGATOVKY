import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

// Как и на витрине: свои токены нужно объявить, иначе tailwind-merge принимает
// цветовые классы за размеры шрифта и вычёркивает их.
const colors = [
  'canvas',
  'surface',
  'raised',
  'line',
  'line-strong',
  'ink',
  'muted',
  'faint',
  'accent',
  'accent-ink',
  'accent-soft',
  'success',
  'warning',
  'danger',
];

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: ['2xs'] }],
      'text-color': [{ text: colors }],
      'bg-color': [{ bg: colors }],
      'border-color': [{ border: colors }],
      rounded: [{ rounded: ['control', 'panel'] }],
    },
  },
});

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
