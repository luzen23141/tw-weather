import { useMemo } from 'react';

import { useLocation } from './useLocation';

import type { Location } from '@/api/types';
import { useLocationsStore } from '@/store/locations.store';

export interface UseEffectiveLocationReturn {
  effectiveLocation: Location | null;
  displayName: string;
  isLoading: boolean;
  error: Error | null;
}

/**
 * 統一取得當前有效地點的 hook
 * 優先使用使用者選定的地點，其次使用目前定位的地點
 * 若都無則回傳 null
 */
export function useEffectiveLocation(): UseEffectiveLocationReturn {
  const { location, isLoading: locationLoading, error: locationError } = useLocation();
  const selectedLocation = useLocationsStore((state) => state.selectedLocation);

  const effectiveLocation = useMemo(() => {
    return selectedLocation || location;
  }, [selectedLocation, location]);

  const displayName = useMemo(() => {
    if (effectiveLocation) {
      return effectiveLocation.name;
    }
    return '台灣天氣';
  }, [effectiveLocation]);

  return {
    effectiveLocation,
    displayName,
    isLoading: locationLoading,
    error: locationError,
  };
}
