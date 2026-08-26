import { useLayoutEffect, useRef } from 'react';
import { gsap, prefersReducedMotion, ScrollTrigger } from '@/lib/motion';
import { cn } from '@/lib/cn';

/**
 * Лента гигантского слова, едущая вбок по мере прокрутки.
 *
 * Главный приём всей затеи и единственный, который работает вообще без фотографий:
 * несущая конструкция здесь — типографика, а не медиа. Слово повторяется столько
 * раз, чтобы лента была заведомо шире экрана, и сдвигается ровно на длину одного
 * повтора — шов при этом не виден.
 *
 * Лента декоративная: от скринридеров скрыта, текст на странице уже есть
 * в настоящем заголовке.
 */
export const KineticBand = ({
  word,
  className,
  /** Насколько лента уезжает за экран прокрутки. Минус — влево. */
  distance = -420,
  outline = false,
  repeat = 4,
}: {
  word: string;
  className?: string;
  distance?: number;
  outline?: boolean;
  repeat?: number;
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root || prefersReducedMotion()) return;

    const track = root.querySelector<HTMLElement>('[data-band-track]');
    if (!track) return;

    const context = gsap.context(() => {
      gsap.fromTo(
        track,
        { x: 0 },
        {
          x: distance,
          ease: 'none',
          scrollTrigger: {
            trigger: root,
            // Лента живёт всё время, пока блок виден: движение привязано к прокрутке,
            // а не к таймеру, поэтому останавливается вместе с пальцем.
            start: 'top bottom',
            end: 'bottom top',
            scrub: 0.8,
          },
        },
      );
    }, root);

    ScrollTrigger.refresh();
    return () => context.revert();
  }, [word, distance]);

  return (
    <div
      ref={ref}
      aria-hidden
      data-testid="kinetic-band"
      className={cn('pointer-events-none select-none overflow-hidden', className)}
    >
      <div data-band-track className="flex w-max gap-[0.25em] will-change-transform">
        {Array.from({ length: repeat }, (_, index) => (
          <span
            key={index}
            data-band-word
            className={cn(
              'font-editorial whitespace-nowrap leading-[0.8]',
              // Чередуем залитые и контурные повторы: сплошная стена букв читается
              // как заливка, а не как типографика
              outline && index % 2 === 1 && 'text-transparent [-webkit-text-stroke:1px_currentColor]',
            )}
          >
            {word}
          </span>
        ))}
      </div>
    </div>
  );
};
