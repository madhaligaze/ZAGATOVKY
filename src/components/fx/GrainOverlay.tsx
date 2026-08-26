/**
 * Плёночное зерно поверх всей страницы.
 *
 * Шум рисует сам браузер через SVG-фильтр в data-URI — никакой картинки не грузится,
 * весь слой стоит пары сотен байт. Лежит выше контента, но не ловит события,
 * поэтому на клики и наведение никак не влияет.
 *
 * Движение зерна включается только там, где разрешено движение: постоянно
 * перерисовывающийся полноэкранный слой на слабом телефоне съедает кадры зря.
 */

// feTurbulence с фиксированным seed: рисунок один и тот же между перезагрузками,
// иначе фон едва заметно «дышит» при каждом заходе.
const NOISE = encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="140" height="140">
     <filter id="n">
       <feTurbulence type="fractalNoise" baseFrequency="0.82" numOctaves="3" seed="7" stitchTiles="stitch"/>
       <feColorMatrix type="saturate" values="0"/>
     </filter>
     <rect width="140" height="140" filter="url(#n)" opacity="0.55"/>
   </svg>`.replace(/\s+/g, ' '),
);

export const GrainOverlay = () => (
  <div
    aria-hidden
    data-testid="grain"
    className="pointer-events-none fixed inset-0 z-[70] opacity-[0.055] mix-blend-multiply motion-safe:animate-[grain_700ms_steps(6)_infinite]"
    style={{
      backgroundImage: `url("data:image/svg+xml,${NOISE}")`,
      backgroundSize: '140px 140px',
      // Слой шире экрана: анимация сдвигает его на несколько пикселей,
      // и без запаса по краям у границы появлялась бы чистая полоса
      inset: '-70px',
    }}
  />
);
