import { lazy, Suspense, useEffect, useState } from 'react';
import { supportsDesktopFx } from '@/lib/fx';

/**
 * Точка входа в «дорогие» украшения: свой курсор и жидкое искажение под указателем.
 *
 * Проверка идёт до импорта, а сам слой подключается через lazy — поэтому на телефоне
 * этот код не только не выполняется, но и не скачивается: он лежит отдельным чанком,
 * за которым браузер идёт лишь после того, как условие сошлось.
 */
const DesktopLayer = lazy(() => import('./DesktopLayer'));

export const DesktopFx = () => {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    // Решение принимаем после первого кадра: до гидрации ширина окна и настройки
    // движения ещё не обязательно те, что будут у пользователя.
    const decide = () => setEnabled(supportsDesktopFx());
    decide();

    // Поворот планшета или подключённая мышь меняют ответ — пересматриваем
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const pointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    motion.addEventListener('change', decide);
    pointer.addEventListener('change', decide);
    window.addEventListener('resize', decide);

    return () => {
      motion.removeEventListener('change', decide);
      pointer.removeEventListener('change', decide);
      window.removeEventListener('resize', decide);
    };
  }, []);

  if (!enabled) return null;

  return (
    <Suspense fallback={null}>
      <DesktopLayer />
    </Suspense>
  );
};
