import { useQuery } from '@tanstack/react-query';
import { api, queryKeys } from '@/lib/api';
import type { PublicSettings } from '@/types/catalog';

/**
 * Контакты, доставка и бренд нужны шапке, подвалу и корзине одновременно.
 * Тянем их из ответа /home, который и так кэшируется — лишнего запроса не будет.
 */
export const usePublicSettings = () =>
  useQuery({
    queryKey: queryKeys.home,
    queryFn: api.home,
    staleTime: 5 * 60 * 1000,
    select: (data): PublicSettings => data.settings,
  });
