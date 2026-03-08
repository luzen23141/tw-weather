jest.mock('expo-location', () => ({}));
jest.mock('react-native', () => ({
  Platform: { OS: 'web' },
}));
jest.mock('@/store/locations.store', () => ({
  useLocationsStore: jest.fn(),
}));

import { getLocationFallback } from './useLocation';

import type { Location } from '@/api/types';

describe('useLocation/getLocationFallback', () => {
  const selectedLocation: Location = {
    latitude: 25.033,
    longitude: 121.5654,
    name: '信義區',
    city: '台北市',
    township: '信義區',
    district: '信義區',
  };

  const savedLocation: Location = {
    latitude: 22.6273,
    longitude: 120.3014,
    name: '高雄市',
    city: '高雄市',
  };

  it('有 selectedLocation 時應優先回傳 selectedLocation', () => {
    const result = getLocationFallback(selectedLocation, [savedLocation]);

    expect(result).toEqual(selectedLocation);
  });

  it('selectedLocation 為 null 時應回傳第一個 saved location', () => {
    const result = getLocationFallback(null, [savedLocation]);

    expect(result).toEqual(savedLocation);
  });

  it('沒有任何可回退地點時應回傳 null', () => {
    const result = getLocationFallback(null, []);

    expect(result).toBeNull();
  });
});
