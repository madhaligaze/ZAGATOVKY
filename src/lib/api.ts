import type {
  Category,
  Collection,
  CreateOrderInput,
  CreatedOrder,
  FeedbackInput,
  HomeData,
  ProductDetail,
  ProductList,
  ProductQuery,
} from '@/types/catalog';

const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1').replace(
  /\/$/,
  '',
);

/** Ошибка API с человекочитаемым текстом от сервера — его и показываем пользователю. */
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

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  let response: Response;

  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: {
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
        ...init?.headers,
      },
    });
  } catch {
    throw new ApiError(0, 'Не удалось связаться с сервером. Проверьте интернет и попробуйте ещё раз.');
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as
      | { message?: string; error?: string }
      | null;
    throw new ApiError(
      response.status,
      body?.message ?? 'Что-то пошло не так. Попробуйте ещё раз.',
      body?.error,
    );
  }

  return (await response.json()) as T;
};

const toQueryString = (params: Record<string, unknown>) => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : '';
};

export const api = {
  home: () => request<HomeData>('/home'),
  categories: () => request<Category[]>('/catalog/categories'),
  products: (query: ProductQuery = {}) =>
    request<ProductList>(`/catalog/products${toQueryString(query)}`),
  product: (slug: string) => request<ProductDetail>(`/catalog/products/${slug}`),
  collection: (slug: string) => request<Collection>(`/catalog/collections/${slug}`),
  createOrder: (input: CreateOrderInput) =>
    request<CreatedOrder>('/orders', { method: 'POST', body: JSON.stringify(input) }),
  sendFeedback: (input: FeedbackInput) =>
    request<{ ok: boolean }>('/feedback', { method: 'POST', body: JSON.stringify(input) }),
};

/** Ключи для TanStack Query — в одном месте, чтобы инвалидация не разъезжалась. */
export const queryKeys = {
  home: ['home'] as const,
  categories: ['categories'] as const,
  products: (query: ProductQuery) => ['products', query] as const,
  product: (slug: string) => ['product', slug] as const,
  collection: (slug: string) => ['collection', slug] as const,
};
