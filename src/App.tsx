import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { RootLayout } from '@/components/layout/RootLayout';
import { HomePage } from '@/pages/HomePage';
import { PageState } from '@/components/ui/PageState';

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
      <Route path="*" element={<Navigate to="/" replace />} />
    </Route>
  </Routes>
);
