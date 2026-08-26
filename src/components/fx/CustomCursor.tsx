import { useEffect, useRef } from 'react';
import { damp } from '@/lib/fx';

/**
 * Курсор-кружок, догоняющий указатель.
 *
 * Системный курсор остаётся на месте: свой рисуем поверх, а не вместо. Прятать
 * настоящий курсор целиком — частая ошибка таких сайтов: стоит скрипту споткнуться,
 * и человек остаётся вообще без указателя.
 *
 * Над ссылками и кнопками кружок раздувается и получает подпись, поэтому работает
 * ещё и как подсказка о том, что элемент кликабельный.
 */
const INTERACTIVE = 'a, button, [role="button"], input, select, textarea, label, summary';

export const CustomCursor = () => {
  const dotRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const dot = dotRef.current;
    if (!dot) return;

    // Стартуем за пределами экрана: до первого движения мыши кружок не должен
    // висеть в левом верхнем углу
    const pointer = { x: -100, y: -100 };
    const current = { x: -100, y: -100 };
    let scale = 1;
    let targetScale = 1;
    let visible = false;
    let frame = 0;
    let last = performance.now();

    const onMove = (event: PointerEvent) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;

      if (!visible) {
        // Первое появление — без «прилёта» через весь экран
        current.x = pointer.x;
        current.y = pointer.y;
        visible = true;
        dot.style.opacity = '1';
      }

      const target = (event.target as HTMLElement | null)?.closest?.(INTERACTIVE);
      targetScale = target ? 2.2 : 1;

      const label = labelRef.current;
      if (label) {
        const hint = target?.getAttribute('data-cursor') ?? '';
        if (label.textContent !== hint) label.textContent = hint;
        label.style.opacity = hint ? '1' : '0';
      }
    };

    const onLeave = () => {
      visible = false;
      dot.style.opacity = '0';
    };

    const render = (now: number) => {
      const delta = Math.min(now - last, 64);
      last = now;

      // Кружок догоняет указатель, а не прилипает к нему — отсюда ощущение веса
      current.x = damp(current.x, pointer.x, 18, delta);
      current.y = damp(current.y, pointer.y, 18, delta);
      scale = damp(scale, targetScale, 12, delta);

      dot.style.transform = `translate3d(${current.x}px, ${current.y}px, 0) translate(-50%, -50%) scale(${scale.toFixed(3)})`;
      frame = requestAnimationFrame(render);
    };

    frame = requestAnimationFrame(render);
    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerleave', onLeave);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return (
    <div
      ref={dotRef}
      aria-hidden
      data-testid="cursor"
      className="pointer-events-none fixed left-0 top-0 z-[80] grid h-8 w-8 place-items-center rounded-pill border border-mountain/40 opacity-0 mix-blend-multiply transition-opacity duration-300 will-change-transform"
    >
      <span
        ref={labelRef}
        className="text-[7px] font-semibold uppercase tracking-[0.1em] text-mountain opacity-0 transition-opacity duration-200"
      />
    </div>
  );
};
