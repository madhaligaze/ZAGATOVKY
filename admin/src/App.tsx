import { useEffect } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { setUnauthorizedHandler } from '@/lib/api';
import { useWorkspace } from '@/store/workspace';
import { AppShell } from '@/components/layout/AppShell';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { ProductsPage } from '@/pages/ProductsPage';
import { ProductEditorPage } from '@/pages/ProductEditorPage';
import { OrdersPage } from '@/pages/OrdersPage';
import { FinancePage } from '@/pages/FinancePage';
import { FeedbackPage } from '@/pages/FeedbackPage';
import { MediaPage } from '@/pages/MediaPage';
import { HomeBuilderPage } from '@/pages/HomeBuilderPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { UsersPage } from '@/pages/UsersPage';
import { AuditPage } from '@/pages/AuditPage';
import { Spinner } from '@/components/ui';

export const App = () => {
  const status = useWorkspace((state) => state.status);
  const bootstrap = useWorkspace((state) => state.bootstrap);
  const navigate = useNavigate();

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  // Если refresh-сессия окончательно истекла — возвращаем на экран входа
  useEffect(() => {
    setUnauthorizedHandler(() => {
      useWorkspace.setState({ user: null, status: 'guest' });
      navigate('/login', { replace: true });
    });
  }, [navigate]);

  if (status === 'checking') {
    return (
      <div className="grid min-h-dvh place-items-center">
        <Spinner label="Проверяем сессию…" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {status === 'authorized' ? (
        <Route element={<AppShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="finance" element={<FinancePage />} />
          <Route path="feedback" element={<FeedbackPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="products/:id" element={<ProductEditorPage />} />
          <Route path="media" element={<MediaPage />} />
          <Route path="home" element={<HomeBuilderPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="audit" element={<AuditPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      ) : (
        <Route path="*" element={<Navigate to="/login" replace />} />
      )}
    </Routes>
  );
};
