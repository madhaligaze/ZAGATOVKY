import { useEffect, useRef } from 'react';
import { gsap, prefersReducedMotion, ScrollTrigger, timing } from '@/lib/motion';

/**
 * Появление элементов с классом .reveal внутри контейнера по мере скролла.
 * Начальное состояние задано в CSS, чтобы контент не мигал до инициализации GSAP.
 *
 * Обработанные элементы помечаются data-revealed и больше не трогаются. Это важно
 * по двум причинам.
 *
 * Первая: содержимое секции может приехать позже её монтирования — например,
 * категории на главной грузятся отдельным запросом. Раньше эффект отрабатывал
 * один раз на пустом контейнере, а пришедшие следом карточки навсегда оставались
 * с opacity: 0 из CSS. Внешне это выглядело как незагрузившийся серый блок.
 * Теперь достаточно передать данные в deps, и хук доберёт новые элементы.
 *
 * Вторая: добор не должен перезапускать уже сыгранное. Без метки повторный
 * прогон гасил показанный заголовок и проигрывал его заново — заметный скачок
 * на глазах у человека.
 */
export const useReveal = <T extends HTMLElement = HTMLDivElement>(deps: unknown[] = []) => {
  const ref = useRef<T>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const targets = Array.from(
      root.querySelectorAll<HTMLElement>('.reveal:not([data-revealed])'),
    );
    if (targets.length === 0) return;

    if (prefersReducedMotion()) {
      gsap.set(targets, { opacity: 1, y: 0, clearProps: 'willChange' });
      for (const target of targets) target.dataset.revealed = '';
      return;
    }

    // Каждая группа .reveal внутри своего блока выезжает лесенкой.
    const tween = gsap.to(targets, {
      opacity: 1,
      y: 0,
      duration: timing.base,
      ease: timing.ease,
      stagger: 0.08,
      clearProps: 'willChange',
      // Метку ставим в момент запуска, а не заранее: до этого элемент ещё
      // не показан, и помечать его «обработанным» рано
      onStart: () => {
        for (const target of targets) target.dataset.revealed = '';
      },
      scrollTrigger: {
        trigger: root,
        start: 'top 85%',
        once: true,
      },
    });

    ScrollTrigger.refresh();

    /*
     * Снимаем только триггер, но не откатываем стили: revert() вернул бы уже
     * показанным элементам исходную прозрачность, и контент моргал бы.
     *
     * А вот с теми, кого показать не успели, метку снимаем — иначе они выпадают
     * из обработки навсегда. Именно на этом ломалась вся главная в режиме
     * разработки: React монтирует компонент дважды, первый проход помечал
     * элементы и тут же сворачивался, а второй уже никого не находил.
     */
    return () => {
      for (const target of targets) {
        if (Number(getComputedStyle(target).opacity) < 0.9) delete target.dataset.revealed;
      }
      tween.scrollTrigger?.kill();
      tween.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return ref;
};
