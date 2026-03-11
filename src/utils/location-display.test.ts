import {
  formatLocationDisplayName,
  formatLocationSecondaryName,
  getLocationTownship,
} from './location-display';

import type { Location } from '@/api/types';

describe('location-display', () => {
  const baseLocation: Location = {
    latitude: 25.033,
    longitude: 121.5654,
    name: '台北市信義區',
    country: '台灣',
    city: '台北市',
    district: '信義區',
    township: '信義區',
    neighborhood: '西村里',
  };

  it('應顯示 縣市 / 鄉鎮市 格式', () => {
    expect(formatLocationDisplayName(baseLocation)).toBe('台北市 / 信義區');
  });

  it('只有縣市時應只顯示縣市', () => {
    const locationCityOnly: Location = {
      latitude: 25.033,
      longitude: 121.5654,
      name: '台北市',
      country: '台灣',
      city: '台北市',
    };
    expect(formatLocationDisplayName(locationCityOnly)).toBe('台北市');
  });

  it('secondary text 應只顯示鄰里', () => {
    expect(formatLocationSecondaryName(baseLocation)).toBe('西村里');
  });

  it('無鄰里時 secondary text 應為 null', () => {
    const locationNoNeighborhood: Location = {
      latitude: 25.033,
      longitude: 121.5654,
      name: '台北市信義區',
      country: '台灣',
      city: '台北市',
      township: '信義區',
    };
    expect(formatLocationSecondaryName(locationNoNeighborhood)).toBeNull();
  });

  it('township 缺失時應回退 district', () => {
    const locationWithoutTownship: Location = {
      latitude: 25.033,
      longitude: 121.5654,
      name: '台北市中正區',
      country: '台灣',
      city: '台北市',
      district: '中正區',
    };

    expect(getLocationTownship(locationWithoutTownship)).toBe('中正區');
    expect(formatLocationDisplayName(locationWithoutTownship)).toBe('台北市 / 中正區');
  });
});
