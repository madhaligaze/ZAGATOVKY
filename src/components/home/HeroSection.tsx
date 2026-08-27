import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { KineticBand } from '@/components/fx/KineticBand';
import { supportsDesktopFx, supportsWebGL } from '@/lib/fx';
import { gsap, prefersReducedMotion, ScrollTrigger } from '@/lib/motion';
import { useLocale } from '@/hooks/useLocale';
import { formatPrice, formatWeight } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { HomeSection, Locale, ProductCard } from '@/types/catalog';

type HeroPayload = {
  eyebrow?: Record<Locale, string>;
  title?: Record<Locale, string>;
  subtitle?: Record<Locale, string>;
  primaryCta?: Record<Locale, string> & { href?: string };
  secondaryCta?: Record<Locale, string> & { href?: string };
};

type Props = {
  section: HomeSection;
  /** Витрина товара в правой колонке — берём первую избранную позицию */
  highlight?: ProductCard;
};

/**
 * Жидкое искажение надписи — отдельным чанком: на телефон и на машины без WebGL
 * оно не скачивается вовсе, там остаётся обычная кинетическая лента.
 */
const HeroFlowmap = lazy(() => import('@/components/fx/HeroFlowmap'));

export const HeroSection = ({ section, highlight }: Props) => {
  const [heroImageBroken, setHeroImageBroken] = useState(false);
  const { locale } = useLocale();
  const payload = section.payload as HeroPayload;
  const rootRef = useRef<HTMLElement>(null);

  const title = payload.title?.[locale] ?? '';
  const lines = title.split('\n');

  // Слово ленты — не заголовок: заголовок читают, ленту видят. Берём короткое,
  // чтобы повтор укладывался в экран целиком и шов не бросался в глаза.
  const bandWord = locale === 'kk' ? 'ДАЙЫНДАМА' : 'ЗАГОТОВКИ';

  /**
   * Искажение включаем только там, где оно уместно и вытянет по кадрам, и только
   * после того, как канвас реально отрисовал первый кадр: иначе на месте ленты
   * на мгновение оказывается пустота.
   */
  const [flowmap, setFlowmap] = useState(false);
  const [flowmapReady, setFlowmapReady] = useState(false);

  useEffect(() => {
    setFlowmap(supportsDesktopFx() && supportsWebGL());
  }, []);

  // useLayoutEffect, а не useEffect: начальное состояние анимации выставляется
  // до первой отрисовки. В разметке элементы видимы — если скрипт задержится
  // или упадёт, посетитель увидит текст, а не пустой тёмный экран.
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const context = gsap.context(() => {
      const lineTargets = root.querySelectorAll<HTMLElement>('[data-hero-line] > span');
      const fadeTargets = root.querySelectorAll<HTMLElement>('[data-hero-fade]');
      const panel = root.querySelector<HTMLElement>('[data-hero-panel]');

      if (prefersReducedMotion()) {
        gsap.set([...lineTargets, ...fadeTargets], { yPercent: 0, opacity: 1 });
        if (panel) gsap.set(panel, { clipPath: 'inset(0% 0% 0% 0%)', opacity: 1 });
        return;
      }

      // Кинематографичный вход: строки заголовка выезжают из-под маски,
      // панель раскрывается clip-path'ом, остальное подтягивается следом.
      //
      // Тайминги намеренно плотные: заголовок и подзаголовок — самый крупный
      // элемент первого экрана, и пока они не отрисованы, браузер считает
      // страницу незагруженной. Каждая доля секунды задержки здесь напрямую
      // ухудшает LCP, поэтому вход начинается сразу и укладывается в ~1 секунду.
      const timeline = gsap.timeline({ defaults: { ease: 'power3.out' } });

      timeline
        .fromTo(lineTargets, { yPercent: 115 }, { yPercent: 0, duration: 0.8, stagger: 0.07 }, 0)
        .fromTo(
          panel,
          { clipPath: 'inset(0% 0% 100% 0%)', opacity: 0, scale: 1.06 },
          { clipPath: 'inset(0% 0% 0% 0%)', opacity: 1, scale: 1, duration: 1 },
          0.15,
        )
        .fromTo(
          fadeTargets,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.55, stagger: 0.07 },
          0.3,
        );

      // Мягкий параллакс панели на скролле
      if (panel) {
        gsap.to(panel, {
          yPercent: -8,
          ease: 'none',
          scrollTrigger: { trigger: root, start: 'top top', end: 'bottom top', scrub: 0.6 },
        });
      }

      ScrollTrigger.refresh();
    }, root);

    return () => context.revert();
  }, [locale, title]);

  return (
    <section ref={rootRef} className="relative overflow-hidden bg-mountain text-parchment">
      {/* Несущая типографика первого экрана.
          Раньше лента стояла по центру секции — там же, где сетка ставит
          заголовок (items-center). Они были центрированы по одной оси и
          обязаны были наложиться: буквы кеглем 240 px шли сквозь «упаковано»,
          а на телефоне — сквозь кнопку «Как это работает».
          Теперь лента прижата к нижнему краю и подрезана им: слово работает
          цоколем первого экрана и переходом к следующей полосе, а не вуалью
          под заголовком. */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-[28%] select-none"
        data-testid="hero-band"
      >
        <KineticBand
          word={bandWord}
          outline
          repeat={3}
          distance={-380}
          className={cn(
            // Ушла из-под заголовка — можно дать чуть больше плотности,
            // чтобы читалась как приём, а не как непрокрасившийся слой
            'text-[clamp(5rem,17vw,15rem)] text-parchment/[0.16] transition-opacity duration-700',
            // Когда канвас готов — DOM-лента уходит, чтобы надпись не двоилась
            flowmapReady && 'opacity-0',
          )}
        />

        {flowmap && (
          <Suspense fallback={null}>
            <HeroFlowmap
              word={bandWord}
              color="rgba(235,231,225,0.16)"
              onReady={() => setFlowmapReady(true)}
              className="absolute inset-0 h-full w-full"
            />
          </Suspense>
        )}
      </div>

      <div className="container-page relative grid items-center gap-12 py-20 md:py-28 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:py-32">
        <div>
          {payload.eyebrow?.[locale] && (
            <p data-hero-fade className="eyebrow gold-rule text-parchment/70">
              {payload.eyebrow[locale]}
            </p>
          )}

          <h1 className="font-editorial mt-6 text-display-lg">
            {lines.map((line, index) => (
              <span key={index} data-hero-line className="block overflow-hidden">
                <span className="block">{line}</span>
              </span>
            ))}
          </h1>

          {payload.subtitle?.[locale] && (
            <p
              data-hero-fade
              className="mt-8 max-w-lg text-lead text-parchment/70"
            >
              {payload.subtitle[locale]}
            </p>
          )}

          <div data-hero-fade className="mt-10 flex flex-wrap gap-3">
            <Button asChild variant="solidLight" size="lg">
              <Link to={payload.primaryCta?.href ?? '/catalog'}>
                {payload.primaryCta?.[locale] ?? 'Смотреть каталог'}
              </Link>
            </Button>
            {payload.secondaryCta?.[locale] && (
              <Button asChild variant="ghostLight" size="lg">
                <a href={payload.secondaryCta.href ?? '#steps'}>
                  {payload.secondaryCta[locale]}
                  <ArrowDown size={16} strokeWidth={1.5} />
                </a>
              </Button>
            )}
          </div>
        </div>

        {/* Правая колонка. Пока нет фотографий — это не пустое место, а «карточка
            заготовки» набранная типографикой: та же система, тот же ритм. */}
        <div
          data-hero-panel
          className="relative aspect-[4/5] w-full max-w-md justify-self-center bg-parchment text-mountain lg:justify-self-end"
        >
          {/* Мёртвая ссылка на фото (файл удалён из хранилища, запись в базе
              осталась) оставляла на первом экране пустой прямоугольник.
              Типографская карточка ниже и есть штатная замена — откатываемся
              к ней, если картинка не загрузилась. */}
          {highlight?.image && !heroImageBroken ? (
            <img
              src={highlight.image.url}
              alt={highlight.name[locale]}
              onError={() => setHeroImageBroken(true)}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full flex-col justify-between p-8">
              <div className="flex items-start justify-between">
                <span className="eyebrow text-mountain/60">
                  {locale === 'kk' ? 'Бүгін тураймыз' : 'Режем сегодня'}
                </span>
                <span className="h-px w-8 translate-y-2 bg-honey" />
              </div>

              <div>
                <p className="font-editorial text-display leading-none">
                  {highlight?.name[locale] ?? (locale === 'kk' ? 'Дайындама' : 'Заготовка')}
                </p>
                {highlight && (
                  <div className="mt-6 flex items-baseline gap-4 border-t border-hairline pt-4">
                    <span className="text-caption uppercase tracking-[0.125em] text-mountain/60">
                      {formatWeight(highlight.weight, locale)}
                    </span>
                    <span className="ml-auto font-editorial text-heading-sm">
                      {formatPrice(highlight.price, locale)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
