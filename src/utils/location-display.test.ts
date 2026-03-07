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

  it('township 格式應優先顯示 township', () => {
    expect(formatLocationDisplayName(baseLocation, 'township')).toBe('信義區');
  });

  it('city-township 格式應顯示 縣市/鄉鎮市', () => {
    expect(formatLocationDisplayName(baseLocation, 'city-township')).toBe('台北市/信義區');
  });

  it('full 格式應顯示國家到鄰里', () => {
    expect(formatLocationDisplayName(baseLocation, 'full')).toBe('台灣/台北市/信義區/西村里');
  });

  it('secondary text 在 township 格式應顯示縣市與鄰里', () => {
    expect(formatLocationSecondaryName(baseLocation, 'township')).toBe('台北市 · 西村里');
  });

  it('secondary text 在 full 格式應為 null', () => {
    expect(formatLocationSecondaryName(baseLocation, 'full')).toBeNull();
  });

  it('township 缺失時應回退 district', () => {
    const locationWithoutTownship: Location = { ...baseLocation, district: '中正區' };
    delete locationWithoutTownship.township;

    expect(getLocationTownship(locationWithoutTownship)).toBe('中正區');
    expect(formatLocationDisplayName(locationWithoutTownship, 'township')).toBe('中正區');
  });
});
