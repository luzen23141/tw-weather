import type { Location } from '@/api/types';

import { dedupeLocations, isSameLocation } from './location-dedupe';

const daan = (overrides: Partial<Location> = {}): Location => ({
  latitude: 25.0263,
  longitude: 121.5432,
  name: '大安區',
  city: '台北市',
  township: '大安區',
  ...overrides,
});

describe('isSameLocation', () => {
  it('同縣市同鄉鎮即為同地點，座標差異不影響 —— 搜尋與 GPS 的大安區是同一個關注對象', () => {
    expect(isSameLocation(daan(), daan({ latitude: 25.033, longitude: 121.5654 }))).toBe(true);
  });

  it('台/臺混用視為相同 —— CWA 用臺、使用者輸入用台', () => {
    expect(isSameLocation(daan({ city: '台北市' }), daan({ city: '臺北市' }))).toBe(true);
  });

  it('不同鄉鎮不是同地點', () => {
    expect(isSameLocation(daan(), daan({ township: '信義區', name: '信義區' }))).toBe(false);
  });

  it('無行政區時以座標距離判斷 —— GPS 連按兩次不會有相同浮點', () => {
    const a: Location = { latitude: 25.02631, longitude: 121.54322, name: 'A' };
    const b: Location = { latitude: 25.02633, longitude: 121.54325, name: 'B' };
    expect(isSameLocation(a, b)).toBe(true);
  });

  it('無行政區且距離超過閾值時不是同地點', () => {
    const a: Location = { latitude: 25.02, longitude: 121.54, name: 'A' };
    const b: Location = { latitude: 25.04, longitude: 121.54, name: 'B' };
    expect(isSameLocation(a, b)).toBe(false);
  });
});

describe('dedupeLocations', () => {
  it('保留先加入的那筆 —— 先者通常是使用者主動搜尋的乾淨定點', () => {
    const first = daan();
    const dup = daan({ latitude: 25.031, longitude: 121.55 });
    expect(dedupeLocations([first, dup])).toEqual([first]);
  });

  it('不同地點全數保留且順序不變', () => {
    const list = [daan(), daan({ township: '信義區' }), daan({ city: '台中市' })];
    expect(dedupeLocations(list)).toEqual(list);
  });

  it('空清單回傳空清單', () => {
    expect(dedupeLocations([])).toEqual([]);
  });
});
