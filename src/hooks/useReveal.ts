import { useEffect, useRef } from 'react';
import { gsap, prefersReducedMotion, ScrollTrigger, timing } from '@/lib/motion';

/**
 * Появление элементов с классом .reveal внутри контейнера по мере скролла.
 * Начальное состояние задано в CSS, чтобы контент не мигал до инициализации GSAP.
 */
export const useReveal = <T extends HTMLElement = HTMLDivElement>(deps: unknown[] = []) => {
  const ref = useRef<T>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const targets = root.querySelectorAll<HTMLElement>('.reveal');
    if (!targets.length) return;

    if (prefersReducedMotion()) {
      gsap.set(targets, { opacity: 1, y: 0, clearProps: 'willChange' });
      return;
    }

    const context = gsap.context(() => {
      // Каждая группа .reveal внутри своего блока выезжает лесенкой.
      gsap.to(targets, {
        opacity: 1,
        y: 0,
        duration: timing.base,
        ease: timing.ease,
        stagger: 0.08,
        clearProps: 'willChange',
        scrollTrigger: {
          trigger: root,
          start: 'top 85%',
          once: true,
        },
      });
    }, root);

    ScrollTrigger.refresh();
    return () => context.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return ref;
};
