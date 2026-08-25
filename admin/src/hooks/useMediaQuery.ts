import { useSyncExternalStore } from 'react';

/**
 * Ширина экрана как значение, а не как CSS-класс.
 *
 * Прятать один из двух вариантов через `lg:hidden` дёшево для верстки, но для канбана
 * и списка заказов это значило бы два одинаковых дерева карточек в DOM: дублирующиеся
 * data-testid, двойные обработчики и по два элемента на каждый заказ для скринридера.
 * Поэтому нужный вариант выбирается заранее и рисуется ровно один.
 */
export const useMediaQuery = (query: string) => {
  const subscribe = (onChange: () => void) => {
    const list = window.matchMedia(query);
    list.addEventListener('change', onChange);
    return () => list.removeEventListener('change', onChange);
  };

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    // На сервере и до гидрации считаем экран узким: мобильная раскладка
    // безопаснее — она помещается в любую ширину.
    () => false,
  );
};

/** Граница, с которой помещается канбан из шести колонок. */
export const useIsWide = () => useMediaQuery('(min-width: 1024px)');
