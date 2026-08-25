import { Suspense, lazy } from 'react';
import { Link, Route, Routes } from 'react-router-dom';
import { RootLayout } from '@/components/layout/RootLayout';
import { HomePage } from '@/pages/HomePage';
import { PageState } from '@/components/ui/PageState';
import { Button } from '@/components/ui/Button';
import { useLocale } from '@/hooks/useLocale';

/** Страница «не найдено»: тот же вертикальный ритм, что у остальных состояний. */
const NotFoundPage = () => {
  const { t } = useLocale();
  return (
    <div className="grid min-h-[calc(100dvh-4.5rem)] place-items-center px-6 text-center">
      <div className="flex flex-col items-center gap-4">
        <span className="h-px w-10 bg-honey" />
        <p className="font-editorial text-heading-sm">{t('common.notFoundTitle')}</p>
        <p className="max-w-sm text-body-sm text-stone">{t('common.notFoundHint')}</p>
        <Button asChild className="mt-2">
          <Link to="/catalog">{t('common.goToCatalog')}</Link>
        </Button>
      </div>
    </div>
  );
};

/**
 * Главная входит в основной бандл — с неё начинается почти каждый визит.
 * Остальные экраны подгружаются по мере перехода, чтобы первый экран
 * не тащил за собой оформление заказа и карточку товара.
 */
const CatalogPage = lazy(() =>
  import('@/pages/CatalogPage').then((module) => ({ default: module.CatalogPage })),
);
const ProductPage = lazy(() =>
  import('@/pages/ProductPage').then((module) => ({ default: module.ProductPage })),
);
const CheckoutPage = lazy(() =>
  import('@/pages/CheckoutPage').then((module) => ({ default: module.CheckoutPage })),
);
const SuccessPage = lazy(() =>
  import('@/pages/SuccessPage').then((module) => ({ default: module.SuccessPage })),
);

export const App = () => (
  <Routes>
    <Route element={<RootLayout />}>
      <Route index element={<HomePage />} />
      <Route
        path="catalog"
        element={
          <Suspense fallback={<PageState />}>
            <CatalogPage />
          </Suspense>
        }
      />
      <Route
        path="product/:slug"
        element={
          <Suspense fallback={<PageState />}>
            <ProductPage />
          </Suspense>
        }
      />
      <Route
        path="checkout"
        element={
          <Suspense fallback={<PageState />}>
            <CheckoutPage />
          </Suspense>
        }
      />
      <Route
        path="success"
        element={
          <Suspense fallback={<PageState />}>
            <SuccessPage />
          </Suspense>
        }
      />
      {/* Раньше неизвестный адрес молча уводил на главную: человек по ссылке
          из чата попадал не туда и не понимал, почему. Теперь честно говорим,
          что страницы нет, и оставляем выход в каталог. */}
      <Route path="*" element={<NotFoundPage />} />
    </Route>
  </Routes>
);
