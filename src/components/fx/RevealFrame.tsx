import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { gsap, prefersReducedMotion, ScrollTrigger } from '@/lib/motion';
import { cn } from '@/lib/cn';

/**
 * Раскрытие содержимого из-под маски плюс параллакс внутри кадра.
 *
 * Тот самый приём, ради которого всё затевалось: содержимое выезжает по мере
 * появления в окне, а внутри кадра едет медленнее страницы — отсюда ощущение
 * глубины. Внутренний слой заранее увеличен, иначе при сдвиге у края показалась
 * бы пустота.
 *
 * Важно, что кадру всё равно, что внутри: фотография, видео или типографская
 * заглушка. Пока снимков нет, приём работает на буквах — а когда фотографии
 * появятся, тот же кадр оживёт сам, без единой правки здесь.
 */
export const RevealFrame = ({
  children,
  className,
  innerClassName,
  /** Насколько содержимое отстаёт от страницы, в процентах высоты кадра */
  parallax = 8,
  /** Задержка внутри группы — для лесенки в сетке */
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
  parallax?: number;
  delay?: number;
}) => {
  const rootRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const inner = root.querySelector<HTMLElement>('[data-reveal-inner]');
    if (!inner) return;

    if (prefersReducedMotion()) {
      gsap.set(root, { clipPath: 'inset(0%)' });
      gsap.set(inner, { yPercent: 0, scale: 1 });
      return;
    }

    const context = gsap.context(() => {
      gsap.fromTo(
        root,
        { clipPath: 'inset(100% 0% 0% 0%)' },
        {
          clipPath: 'inset(0% 0% 0% 0%)',
          duration: 1.05,
          delay,
          ease: 'power3.out',
          scrollTrigger: { trigger: root, start: 'top 88%', once: true },
        },
      );

      if (parallax > 0) {
        // Содержимое едет от +parallax к -parallax, поэтому середина пути
        // приходится ровно на центр экрана и кадр никогда не обнажает края
        gsap.fromTo(
          inner,
          { yPercent: parallax },
          {
            yPercent: -parallax,
            ease: 'none',
            scrollTrigger: {
              trigger: root,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 0.7,
            },
          },
        );
      }
    }, root);

    ScrollTrigger.refresh();
    return () => context.revert();
  }, [parallax, delay]);

  return (
    <div
      ref={rootRef}
      data-testid="reveal-frame"
      className={cn('relative overflow-hidden', className)}
      // Начальное состояние в разметке, а не только в GSAP: если скрипт задержится,
      // содержимое всё равно видно, а не скрыто маской навсегда
      style={{ clipPath: 'inset(0%)' }}
    >
      <div
        data-reveal-inner
        className={cn('h-full w-full will-change-transform', innerClassName)}
        // Запас под параллакс: без него сдвиг обнажал бы полосу фона у края кадра
        style={parallax > 0 ? { scale: `${1 + parallax / 100 + 0.02}` } : undefined}
      >
        {children}
      </div>
    </div>
  );
};
