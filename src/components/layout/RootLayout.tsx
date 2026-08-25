import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { ScrollTrigger } from '@/lib/motion';

export const RootLayout = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      // Якорь на главной: даём разметке отрисоваться, потом прокручиваем
      const target = document.querySelector(hash);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }
    window.scrollTo({ top: 0, behavior: 'auto' });
    // Высоты страниц разные — пересчитываем триггеры после смены маршрута
    ScrollTrigger.refresh();
  }, [pathname, hash]);

  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
};
