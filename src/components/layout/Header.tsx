import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, ShoppingBag, X } from 'lucide-react';
import { useCart, selectCount } from '@/store/cart';
import { useLocale } from '@/hooks/useLocale';
import { LogoMark } from '@/components/ui/LogoMark';
import { cn } from '@/lib/cn';

const links = [
  { to: '/catalog', key: 'nav.catalog' },
  { to: '/catalog?type=BUNDLE', key: 'nav.bundles' },
  { to: '/#steps', key: 'nav.how' },
  { to: '/#contacts', key: 'nav.contacts' },
] as const;

export const Header = () => {
  const { t, locale, setLocale } = useLocale();
  const count = useCart(selectCount);
  const openCart = useCart((state) => state.open);
  const location = useLocation();

  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setMenuOpen(false), [location.pathname, location.search]);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 bg-snow/90 backdrop-blur-md transition-[border-color,box-shadow] duration-300',
        scrolled ? 'border-b border-hairline' : 'border-b border-transparent',
      )}
    >
      <div className="container-page flex h-18 items-center justify-between gap-3 py-4 lg:gap-6">
        <Link
          to="/"
          className="flex items-center gap-2 sm:gap-2.5"
          aria-label="ZAGATOVKY"
          data-testid="logo"
        >
          <LogoMark className="h-7 w-7 sm:h-8 sm:w-8" />
          {/* Ниже 360 px словесный знак снимается: с ним шапка требовала 336 px
              при доступных 280, и страница уезжала вбок на 39 px. */}
          <span className="hidden font-editorial text-[1.125rem] leading-none tracking-tight min-[360px]:inline sm:text-heading-sm">
            ZAGATOVKY
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  'rounded-pill px-4 py-2 text-caption uppercase tracking-[0.125em] transition-colors',
                  isActive && link.to === location.pathname
                    ? 'bg-mountain text-parchment'
                    : 'text-mountain hover:bg-parchment',
                )
              }
            >
              {t(link.key)}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Переключатель языка — две пилюли, текущая залита тилом.
              На узких экранах поджимаем отступы и трекинг: иначе шапка
              с логотипом, языком, корзиной и бургером не помещается в 390px. */}
          <div
            className="flex items-center rounded-pill border border-hairline p-0.5"
            role="group"
            aria-label="Язык / Тіл"
          >
            {(['ru', 'kk'] as const).map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => setLocale(code)}
                aria-pressed={locale === code}
                data-testid={`locale-${code}`}
                className={cn(
                  'grid min-h-11 place-items-center rounded-pill px-2 text-caption uppercase tracking-normal transition-colors sm:px-3 sm:tracking-[0.125em]',
                  locale === code ? 'bg-mountain text-parchment' : 'text-stone hover:text-mountain',
                )}
              >
                {code === 'ru' ? 'Рус' : 'Қаз'}
              </button>
            ))}
          </div>

          <button
            type="button"
            id="cart-button"
            onClick={openCart}
            data-testid="cart-button"
            aria-label={`${t('nav.cart')}${count ? `, ${count}` : ''}`}
            className="relative grid h-11 w-11 place-items-center rounded-pill border border-hairline text-mountain transition-colors hover:border-teal hover:bg-parchment"
          >
            <ShoppingBag size={18} strokeWidth={1.5} />
            {count > 0 && (
              <span
                data-testid="cart-count"
                className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-pill bg-honey px-1 text-[11px] font-bold tabular-nums text-mountain"
              >
                {count}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? t('nav.close') : t('nav.menu')}
            aria-expanded={menuOpen}
            className="grid h-11 w-11 place-items-center rounded-pill border border-hairline text-mountain lg:hidden"
          >
            {menuOpen ? <X size={18} strokeWidth={1.5} /> : <Menu size={18} strokeWidth={1.5} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="border-t border-hairline bg-snow lg:hidden">
          <div className="container-page flex flex-col py-2">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className="border-b border-hairline py-4 text-caption uppercase tracking-[0.125em] last:border-0"
              >
                {t(link.key)}
              </NavLink>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
};
