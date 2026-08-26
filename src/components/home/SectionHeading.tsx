import { useLayoutEffect, useRef } from 'react';
import { splitText } from '@/lib/fx';
import { gsap, prefersReducedMotion, ScrollTrigger } from '@/lib/motion';
import { cn } from '@/lib/cn';

type Props = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: 'left' | 'center';
  tone?: 'dark' | 'light';
  className?: string;
  action?: React.ReactNode;
};

/**
 * Заголовок секции: золотая засечка, надзаголовок капсом, serif-заголовок,
 * выезжающий по буквам при появлении в окне.
 *
 * Разбивка по буквам делается в эффекте, а не в разметке: в HTML остаётся обычный
 * текст, поэтому он читается поисковиком и виден, даже если скрипт не отработал.
 * Скринридеру отдаём исходную строку через aria-label, а сами буквы от него скрыты —
 * иначе он произносил бы заголовок по одному символу.
 */
export const SectionHeading = ({
  eyebrow,
  title,
  subtitle,
  align = 'left',
  tone = 'dark',
  className,
  action,
}: Props) => {
  const titleRef = useRef<HTMLHeadingElement>(null);

  useLayoutEffect(() => {
    const element = titleRef.current;
    if (!element || prefersReducedMotion()) return;

    const split = splitText(element);
    if (split.chars.length === 0) return;

    const context = gsap.context(() => {
      gsap.fromTo(
        split.chars,
        { yPercent: 110 },
        {
          yPercent: 0,
          duration: 0.85,
          ease: 'power3.out',
          // Буквы идут волной, но быстро: заголовок должен собраться,
          // пока взгляд на него, а не рассыпаться на секунды
          stagger: { each: 0.018, from: 'start' },
          scrollTrigger: { trigger: element, start: 'top 88%', once: true },
        },
      );
    }, element);

    ScrollTrigger.refresh();
    return () => {
      context.revert();
      split.revert();
    };
  }, [title]);

  return (
    <div
      className={cn(
        'flex flex-col gap-4 md:flex-row md:items-end md:justify-between',
        align === 'center' && 'md:flex-col md:items-center md:text-center',
        className,
      )}
    >
      <div className={cn('max-w-2xl', align === 'center' && 'text-center')}>
        {eyebrow && (
          <p
            className={cn(
              'eyebrow reveal',
              align === 'left' && 'gold-rule',
              tone === 'light' ? 'text-parchment/60' : 'text-stone',
            )}
          >
            {eyebrow}
          </p>
        )}

        {/* .reveal здесь намеренно нет: заголовок анимируется побуквенно,
            иначе к нему применились бы сразу два разных появления */}
        <h2 ref={titleRef} className="font-editorial mt-4 text-heading-lg">
          {title}
        </h2>

        {subtitle && (
          <p
            className={cn(
              'reveal mt-4 text-lead',
              tone === 'light' ? 'text-parchment/70' : 'text-stone',
            )}
          >
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="reveal shrink-0">{action}</div>}
    </div>
  );
};
