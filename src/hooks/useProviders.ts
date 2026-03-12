import { useQuery } from '@tanstack/react-query';

import { fetchProviders, type ProviderInfo } from '@/api/provider';

/** 從後端取得可用的 provider 清單 */
export function useProviders() {
  return useQuery<ProviderInfo[]>({
    queryKey: ['providers'],
    queryFn: fetchProviders,
    staleTime: Infinity,
  });
}
