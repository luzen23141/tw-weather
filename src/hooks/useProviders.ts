import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { fetchProviders, type Provider } from '@/api/providers';

/**
 * 資料源清單。
 *
 * staleTime 拉長到一小時：來源清單只在部署或改金鑰時變動，
 * 每次進設定頁都重打沒有意義。
 */
export function useProviders(): UseQueryResult<Provider[], Error> {
  return useQuery({
    queryKey: ['providers'],
    queryFn: fetchProviders,
    staleTime: 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    retry: 1,
  });
}
