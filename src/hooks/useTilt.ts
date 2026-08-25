import { useEffect, useRef } from 'react';
import { gsap, prefersReducedMotion } from '@/lib/motion';

/**
 * Лёгкий 3D-наклон карточки за курсором. Только для мыши: на тач-устройствах
 * наклон только мешает, поэтому там эффект не подключается вовсе.
 */
export const useTilt = <T extends HTMLElement = HTMLDivElement>(maxDegrees = 5) => {
  const ref = useRef<T>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (prefersReducedMotion()) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    const setRotateX = gsap.quickTo(element, 'rotationX', { duration: 0.5, ease: 'power3.out' });
    const setRotateY = gsap.quickTo(element, 'rotationY', { duration: 0.5, ease: 'power3.out' });

    gsap.set(element, { transformPerspective: 900, transformOrigin: 'center' });

    const onMove = (event: PointerEvent) => {
      const rect = element.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      setRotateY(x * maxDegrees * 2);
      setRotateX(-y * maxDegrees * 2);
    };

    const onLeave = () => {
      setRotateX(0);
      setRotateY(0);
    };

    element.addEventListener('pointermove', onMove);
    element.addEventListener('pointerleave', onLeave);

    return () => {
      element.removeEventListener('pointermove', onMove);
      element.removeEventListener('pointerleave', onLeave);
      gsap.set(element, { clearProps: 'transform' });
    };
  }, [maxDegrees]);

  return ref;
};
