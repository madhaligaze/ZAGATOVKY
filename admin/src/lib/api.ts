import type { paths } from '@/types/api';

const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1').replace(
  /\/$/,
  '',
);

type Json<T extends { content: { 'application/json': unknown } }> = T['content']['application/json'];

export type AdminUser = Json<
  paths['/api/v1/admin/auth/me']['get']['responses'][200]
>;
export type Session = Json<paths['/api/v1/admin/auth/login']['post']['responses'][200]>;
export type AdminProduct = Json<
  paths['/api/v1/admin/products']['get']['responses'][200]
>['items'][number];
export type ProductBody = NonNullable<
  paths['/api/v1/admin/products']['post']['requestBody']
>['content']['application/json'];
export type AdminCategory = Json<
  paths['/api/v1/admin/categories']['get']['responses'][200]
>[number];
export type CategoryBody = NonNullable<
  paths['/api/v1/admin/categories']['post']['requestBody']
>['content']['application/json'];
export type AdminCollection = Json<
  paths['/api/v1/admin/collections']['get']['responses'][200]
>[number];
export type CollectionBody = NonNullable<
  paths['/api/v1/admin/collections']['post']['requestBody']
>['content']['application/json'];
export type AdminOrder = Json<
  paths['/api/v1/admin/orders']['get']['responses'][200]
>['items'][number];
export type OrderStatus = AdminOrder['status'];
export type MediaAsset = Json<
  paths['/api/v1/admin/media']['get']['responses'][200]
>['items'][number];
export type HomeSectionRow = Json<
  paths['/api/v1/admin/home-sections']['get']['responses'][200]
>[number];
export type Stats = Json<paths['/api/v1/admin/stats']['get']['responses'][200]>;
export type AuditRow = Json<
  paths['/api/v1/admin/audit']['get']['responses'][200]
>['items'][number];
export type AdminAccount = Json<paths['/api/v1/admin/users']['get']['responses'][200]>[number];
export type Badge = Json<paths['/api/v1/admin/badges']['get']['responses'][200]>[number];
export type PublicSettings = Json<
  paths['/api/v1/settings/public']['get']['responses'][200]
>;

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Access-токен живёт только в памяти вкладки — в localStorage его не кладём,
 * чтобы XSS не мог его вычитать. Долгую сессию держит httpOnly refresh-cookie.
 */
let accessToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};
export const getAccessToken = () => accessToken;
export const setUnauthorizedHandler = (handler: () => void) => {
  onUnauthorized = handler;
};

/** Обновление токена: параллельные 401 должны ждать один и тот же запрос. */
let refreshPromise: Promise<boolean> | null = null;

const refreshSession = () => {
  refreshPromise ??= (async () => {
    try {
      const response = await fetch(`${BASE_URL}/admin/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) return false;
      const session = (await response.json()) as Session;
      accessToken = session.accessToken;
      return true;
    } catch {
      return false;
    } finally {
      // Сбрасываем в микротаске, чтобы ожидающие успели прочитать результат
      queueMicrotask(() => {
        refreshPromise = null;
      });
    }
  })();

  return refreshPromise;
};

type RequestOptions = Omit<RequestInit, 'body'> & { body?: unknown; raw?: BodyInit };

const request = async <T>(path: string, options: RequestOptions = {}, retry = true): Promise<T> => {
  const { body, raw, headers, ...init } = options;

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...init,
      credentials: 'include',
      headers: {
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...headers,
      },
      body: raw ?? (body === undefined ? undefined : JSON.stringify(body)),
    });
  } catch {
    throw new ApiError(0, 'Сервер недоступен. Проверьте, запущен ли API.');
  }

  if (response.status === 401 && retry) {
    if (await refreshSession()) return request<T>(path, options, false);
    onUnauthorized?.();
  }

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { message?: string; error?: string }
      | null;
    throw new ApiError(
      response.status,
      payload?.message ?? 'Не удалось выполнить операцию',
      payload?.error,
    );
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
};

const qs = (params: Record<string, unknown>) => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : '';
};

export const api = {
  // Авторизация
  login: (body: { email: string; password: string }) =>
    request<Session>('/admin/auth/login', { method: 'POST', body }),
  refresh: () => request<Session>('/admin/auth/refresh', { method: 'POST' }, false),
  logout: () => request<{ ok: boolean }>('/admin/auth/logout', { method: 'POST' }),
  me: () => request<AdminUser>('/admin/auth/me'),
  savePrefs: (prefs: Record<string, unknown>) =>
    request<{ prefs: Record<string, unknown> }>('/admin/auth/me/prefs', {
      method: 'PATCH',
      body: prefs,
    }),

  // Каталог
  products: (params: Record<string, unknown> = {}) =>
    request<{ items: AdminProduct[]; total: number }>(`/admin/products${qs(params)}`),
  product: (id: string) => request<AdminProduct>(`/admin/products/${id}`),
  createProduct: (body: ProductBody) =>
    request<AdminProduct>('/admin/products', { method: 'POST', body }),
  updateProduct: (id: string, body: ProductBody) =>
    request<AdminProduct>(`/admin/products/${id}`, { method: 'PUT', body }),
  bulkProducts: (body: { ids: string[]; patch: Record<string, unknown> }) =>
    request<{ updated: number }>('/admin/products/bulk', { method: 'PATCH', body }),
  reorderProducts: (ids: string[]) =>
    request<{ ok: boolean }>('/admin/products/reorder', { method: 'PATCH', body: { ids } }),
  deleteProduct: (id: string) =>
    request<{ ok: boolean }>(`/admin/products/${id}`, { method: 'DELETE' }),

  // Контент
  categories: () => request<AdminCategory[]>('/admin/categories'),
  createCategory: (body: CategoryBody) =>
    request<AdminCategory>('/admin/categories', { method: 'POST', body }),
  updateCategory: (id: string, body: CategoryBody) =>
    request<AdminCategory>(`/admin/categories/${id}`, { method: 'PUT', body }),
  deleteCategory: (id: string) =>
    request<{ ok: boolean }>(`/admin/categories/${id}`, { method: 'DELETE' }),

  collections: () => request<AdminCollection[]>('/admin/collections'),
  createCollection: (body: CollectionBody) =>
    request<AdminCollection>('/admin/collections', { method: 'POST', body }),
  updateCollection: (id: string, body: CollectionBody) =>
    request<AdminCollection>(`/admin/collections/${id}`, { method: 'PUT', body }),
  deleteCollection: (id: string) =>
    request<{ ok: boolean }>(`/admin/collections/${id}`, { method: 'DELETE' }),

  homeSections: () => request<HomeSectionRow[]>('/admin/home-sections'),
  createHomeSection: (body: { kind: string; payload: Record<string, unknown> }) =>
    request<HomeSectionRow>('/admin/home-sections', { method: 'POST', body }),
  updateHomeSection: (
    id: string,
    body: { payload: Record<string, unknown>; isVisible: boolean; sortOrder: number },
  ) => request<HomeSectionRow>(`/admin/home-sections/${id}`, { method: 'PUT', body }),
  reorderHomeSections: (ids: string[]) =>
    request<{ ok: boolean }>('/admin/home-sections/reorder', { method: 'PATCH', body: { ids } }),
  deleteHomeSection: (id: string) =>
    request<{ ok: boolean }>(`/admin/home-sections/${id}`, { method: 'DELETE' }),

  badges: () => request<Badge[]>('/admin/badges'),
  publicSettings: () => request<PublicSettings>('/settings/public'),
  saveSettings: (group: string, body: Record<string, unknown>) =>
    request<unknown>(`/admin/settings/${group}`, { method: 'PUT', body }),

  // Медиа
  media: (params: Record<string, unknown> = {}) =>
    request<{ items: MediaAsset[]; total: number; storageEnabled: boolean }>(
      `/admin/media${qs(params)}`,
    ),
  uploadMedia: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return request<MediaAsset>('/admin/media', { method: 'POST', raw: form });
  },
  deleteMedia: (id: string) => request<{ ok: boolean }>(`/admin/media/${id}`, { method: 'DELETE' }),

  // Заказы
  orders: (params: Record<string, unknown> = {}) =>
    request<{ items: AdminOrder[]; total: number }>(`/admin/orders${qs(params)}`),
  setOrderStatus: (id: string, body: { status: OrderStatus; note?: string }) =>
    request<AdminOrder>(`/admin/orders/${id}/status`, { method: 'PATCH', body }),
  setOrderPaid: (id: string, isPaid: boolean) =>
    request<AdminOrder>(`/admin/orders/${id}/paid`, { method: 'PATCH', body: { isPaid } }),
  clearTestOrders: () =>
    request<{ deleted: number }>('/admin/orders/test', { method: 'DELETE' }),

  // Система
  stats: () => request<Stats>('/admin/stats'),
  audit: (params: Record<string, unknown> = {}) =>
    request<{ items: AuditRow[]; total: number }>(`/admin/audit${qs(params)}`),
  users: () => request<AdminAccount[]>('/admin/users'),
  createUser: (body: { email: string; name: string; password: string; role: string }) =>
    request<AdminAccount>('/admin/users', { method: 'POST', body }),
  updateUser: (id: string, body: Record<string, unknown>) =>
    request<AdminAccount>(`/admin/users/${id}`, { method: 'PATCH', body }),
};

export const keys = {
  stats: ['stats'] as const,
  products: (params: Record<string, unknown>) => ['products', params] as const,
  product: (id: string) => ['product', id] as const,
  categories: ['categories'] as const,
  collections: ['collections'] as const,
  homeSections: ['home-sections'] as const,
  badges: ['badges'] as const,
  media: (params: Record<string, unknown>) => ['media', params] as const,
  orders: (params: Record<string, unknown>) => ['orders', params] as const,
  audit: (params: Record<string, unknown>) => ['audit', params] as const,
  users: ['users'] as const,
  settings: ['settings'] as const,
};
