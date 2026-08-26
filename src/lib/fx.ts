import { prefersReducedMotion } from './motion';

/**
 * Тяжёлые украшения — свой курсор, зерно и WebGL-искажение — включаются только там,
 * где они не мешают.
 *
 * Условие одно и то же для всех трёх: точный указатель (мышь, а не палец), достаточно
 * широкий экран и не включённый режим «меньше движения». На телефоне ни один из этих
 * слоёв не появляется, поэтому и в мобильный бандл они не попадают — грузятся
 * отдельным чанком уже после проверки.
 */
export const supportsDesktopFx = () => {
  if (typeof window === 'undefined') return false;
  if (prefersReducedMotion()) return false;

  // Палец не наводит: курсор и искажение под указателем на тач-экране бессмысленны
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return false;
  if (window.innerWidth < 1024) return false;

  // Слабым машинам лишний кадр дороже, чем нам эффект
  const cores = navigator.hardwareConcurrency;
  if (typeof cores === 'number' && cores > 0 && cores < 4) return false;

  return true;
};

/** Есть ли вообще WebGL — на части офисных машин и в части браузеров его нет. */
export const supportsWebGL = () => {
  if (typeof document === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      canvas.getContext('webgl2') ??
        canvas.getContext('webgl') ??
        canvas.getContext('experimental-webgl'),
    );
  } catch {
    return false;
  }
};

/** Линейная интерполяция — основа плавного догоняющего движения. */
export const lerp = (from: number, to: number, amount: number) => from + (to - from) * amount;

/**
 * Сглаживание, не зависящее от частоты кадров. На 120 Гц и на 60 Гц движение
 * получается одинаковым по скорости, а не вдвое быстрее на быстром мониторе.
 */
export const damp = (from: number, to: number, smoothing: number, deltaMs: number) =>
  lerp(from, to, 1 - Math.exp(-smoothing * (deltaMs / 1000)));

/**
 * Разбивает текст на слова и буквы, обёрнутые в span.
 *
 * Слово остаётся неразрывным контейнером, поэтому строка переносится по словам,
 * как обычный текст, а не рассыпается по буквам. Для скринридеров исходная строка
 * остаётся доступной через aria-label, а сами буквы скрыты от них.
 */
export type SplitResult = { chars: HTMLElement[]; words: HTMLElement[]; revert: () => void };

export const splitText = (element: HTMLElement): SplitResult => {
  const original = element.innerHTML;
  const source = element.textContent ?? '';

  element.setAttribute('aria-label', source);
  element.innerHTML = '';

  const chars: HTMLElement[] = [];
  const words: HTMLElement[] = [];

  for (const [index, word] of source.split(/(\s+)/).entries()) {
    if (word.trim() === '') {
      element.append(word);
      continue;
    }

    const wordSpan = document.createElement('span');
    wordSpan.className = 'split-word';
    wordSpan.setAttribute('aria-hidden', 'true');
    wordSpan.dataset.index = String(index);

    for (const char of Array.from(word)) {
      const charSpan = document.createElement('span');
      charSpan.className = 'split-char';
      charSpan.textContent = char;
      wordSpan.append(charSpan);
      chars.push(charSpan);
    }

    element.append(wordSpan);
    words.push(wordSpan);
  }

  return {
    chars,
    words,
    revert: () => {
      element.innerHTML = original;
      element.removeAttribute('aria-label');
    },
  };
};
