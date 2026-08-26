import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { DesktopFx } from '@/components/fx/DesktopFx';
import { GrainOverlay } from '@/components/fx/GrainOverlay';
import { useSmoothScroll, scrollTo } from '@/hooks/useSmoothScroll';
import { ScrollTrigger } from '@/lib/motion';

export const RootLayout = () => {
  const { pathname, hash } = useLocation();

  useSmoothScroll();

  // Браузер сам восстанавливает прокрутку при навигации по history, и на SPA это
  // выглядит как «страница открылась снизу». Позицию мы задаём сами.
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  useEffect(() => {
    if (hash) {
      // Якорь на главной: даём разметке отрисоваться, потом прокручиваем
      const target = document.querySelector(hash);
      if (target) {
        scrollTo(target as HTMLElement, { offset: -72 });
        return;
      }
    }

    // Порядок важен: ScrollTrigger.refresh() возвращает прокрутку туда, где она была
    // на момент вызова, поэтому сначала пересчитываем триггеры под новую высоту
    // страницы и только потом уходим наверх. Обратный порядок и давал открытие
    // страницы «в подвале».
    ScrollTrigger.refresh();
    scrollTo(0, { immediate: true });

    // Изображения и шрифты догружаются после первого кадра и меняют высоту секций —
    // повторяем на следующем кадре, иначе прокрутка снова уезжает.
    const frame = window.requestAnimationFrame(() => {
      scrollTo(0, { immediate: true });
      ScrollTrigger.refresh();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [pathname, hash]);

  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <CartDrawer />

      {/* Зерно и курсор с искажением — верхние слои, не влияющие на разметку.
          DesktopFx сам решает, грузиться ему или нет: на телефоне он не приезжает. */}
      <GrainOverlay />
      <DesktopFx />
    </div>
  );
};
