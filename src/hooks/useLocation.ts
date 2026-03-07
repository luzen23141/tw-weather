import * as ExpoLocation from 'expo-location';
import { useEffect, useState, useCallback } from 'react';
import { Platform } from 'react-native';

import { Location } from '@/api/types';
import { useLocationsStore } from '@/store/locations.store';
import { formatLocationDisplayName } from '@/utils/location-display';

/**
 * useLocation Hook
 *
 * 功能：
 * - 取得使用者的地理定位
 * - 回退到已儲存的地點
 * - 錯誤處理和許可權管理
 */
export function useLocation(): {
  location: Location | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
} {
  const [location, setLocation] = useState<Location | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const selectedLocation = useLocationsStore((state) => state.selectedLocation);
  const savedLocations = useLocationsStore((state) => state.savedLocations);

  /**
   * 內部函式：取得當前地理定位
   */
  const fetchCurrentLocation = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      // 請求許可權 (Web上原生的 Permissions API 不一定可靠，改直接 request 定位)
      let status = 'granted';
      if (Platform.OS !== 'web') {
        const result = await ExpoLocation.requestForegroundPermissionsAsync();
        status = result.status;
      }

      if (status !== 'granted') {
        // 許可權被拒絕，使用已儲存的地點
        if (selectedLocation) {
          setLocation(selectedLocation);
        } else if (savedLocations.length > 0 && savedLocations[0]) {
          setLocation(savedLocations[0]);
        } else {
          throw new Error('位置許可權被拒絕，且無儲存的地點');
        }
        return;
      }

      // 取得當前位置，設定合理 timeout 避免 Web 權限徵詢被忽略時卡住 (15秒)
      const currentLocation = await Promise.race([
        ExpoLocation.getCurrentPositionAsync({
          accuracy: ExpoLocation.Accuracy.Balanced,
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('取得位置逾時，請確認是否允許存取定位')), 15000),
        ),
      ]);

      const { latitude, longitude } = currentLocation.coords;

      // 嘗試反向地理編碼取得地點名稱
      const reversedLocation = await ExpoLocation.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      const placeName = reversedLocation[0];
      const country = placeName?.country || '';
      const city = placeName?.city || placeName?.region || '';
      const township = placeName?.district || placeName?.subregion || '';
      const neighborhood = placeName?.street || placeName?.name || '';

      const newLocation: Location = {
        latitude,
        longitude,
        name: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
        ...(country ? { country } : {}),
        ...(city ? { city } : {}),
        ...(township ? { district: township, township } : {}),
        ...(neighborhood ? { neighborhood } : {}),
      };

      newLocation.name = formatLocationDisplayName(newLocation, 'township');

      setLocation(newLocation);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知地理定位錯誤';
      // 判斷是否為權限拒絕的相關錯誤 (在 Web 常拋出 permission denied 或 User denied Geolocation)
      const isPermissionDenied =
        errorMessage.toLowerCase().includes('denied') || errorMessage.includes('逾時');

      const error = new Error(isPermissionDenied ? '無法取得位置權限或定位逾時' : errorMessage);
      setError(error);

      // 回退：使用已儲存的地點
      if (selectedLocation) {
        setLocation(selectedLocation);
        setError(null); // 清除錯誤，因為我們有回退方案
      } else if (savedLocations.length > 0) {
        const firstLocation = savedLocations[0];
        if (firstLocation) {
          setLocation(firstLocation);
        }
        setError(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, [selectedLocation, savedLocations]);

  /**
   * 初始載入
   */
  useEffect(() => {
    void fetchCurrentLocation();
  }, [fetchCurrentLocation]);

  /**
   * 當選中的地點改變時，更新位置
   */
  useEffect(() => {
    if (
      selectedLocation &&
      (!location ||
        location.latitude !== selectedLocation.latitude ||
        location.longitude !== selectedLocation.longitude)
    ) {
      setLocation(selectedLocation);
    }
  }, [selectedLocation, location]);

  return {
    location,
    isLoading,
    error,
    refetch: fetchCurrentLocation,
  };
}

/**
 * useLocationPermission Hook
 *
 * 只檢查和請求位置許可權
 */
export function useLocationPermission(): {
  hasPermission: boolean | null;
  isLoading: boolean;
  request: () => Promise<boolean>;
} {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * 檢查許可權
   */
  const checkPermission = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      const { status } = await ExpoLocation.getForegroundPermissionsAsync();
      setHasPermission(status === 'granted');
    } catch (error) {
      console.error('檢查許可權失敗:', error);
      setHasPermission(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      let granted = false;
      if (Platform.OS === 'web') {
        try {
          await Promise.race([
            ExpoLocation.getCurrentPositionAsync({
              accuracy: ExpoLocation.Accuracy.Balanced,
            }),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('timeout')), 15000),
            ),
          ]);
          granted = true;
        } catch {
          granted = false;
        }
      } else {
        const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
        granted = status === 'granted';
      }
      setHasPermission(granted);
      return granted;
    } catch (error) {
      console.error('請求許可權失敗:', error);
      setHasPermission(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 初始載入
   */
  useEffect(() => {
    void checkPermission();
  }, [checkPermission]);

  return {
    hasPermission,
    isLoading,
    request: requestPermission,
  };
}
