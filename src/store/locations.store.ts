import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import type { Location } from '@/api/types';
import { storage } from '@/cache/storage';
import { dedupeLocations, isSameLocation } from '@/utils/location-dedupe';

export interface LocationsState {
  // 狀態
  savedLocations: Location[];
  selectedLocation: Location | null;

  // Actions
  addLocation: (location: Location) => void;
  removeLocation: (key: string) => void;
  setSelectedLocation: (location: Location) => void;
  updateLocations: (locations: Location[]) => void;
}

export const useLocationsStore = create<LocationsState>()(
  persist(
    (set) => ({
      // 初始值
      savedLocations: [],
      selectedLocation: null,

      // Actions
      addLocation: (location) =>
        set((state) => {
          // 以行政區＋座標距離判斷重複，而非浮點精確相等 ——
          // 搜尋加入與 GPS 定位的同一個鄉鎮，座標永遠不會精確相同
          const exists = state.savedLocations.some((loc) => isSameLocation(loc, location));

          if (exists) {
            return state;
          }

          const newLocations = [...state.savedLocations, location];
          return {
            savedLocations: newLocations,
            selectedLocation: state.selectedLocation === null ? location : state.selectedLocation,
          } as LocationsState;
        }),

      removeLocation: (key) =>
        set((state) => {
          const parts = key.split(',');
          const lat = Number(parts[0]);
          const lon = Number(parts[1]);
          if (Number.isNaN(lat) || Number.isNaN(lon)) {
            return state;
          }
          const newLocations = state.savedLocations.filter(
            (loc) => !(loc.latitude === lat && loc.longitude === lon),
          );

          return {
            savedLocations: newLocations,
            selectedLocation:
              state.selectedLocation?.latitude === lat && state.selectedLocation?.longitude === lon
                ? newLocations.length > 0
                  ? newLocations[0]
                  : null
                : state.selectedLocation,
          } as LocationsState;
        }),

      setSelectedLocation: (location) => set({ selectedLocation: location }),

      updateLocations: (locations) =>
        set((state) => {
          // 檢查當前選定地點是否仍存在於新列表中
          const selectedStillExists =
            state.selectedLocation &&
            locations.some(
              (loc) =>
                loc.latitude === state.selectedLocation?.latitude &&
                loc.longitude === state.selectedLocation?.longitude,
            );

          return {
            savedLocations: locations,
            selectedLocation:
              locations.length === 0
                ? null
                : selectedStillExists
                  ? state.selectedLocation
                  : locations[0],
          } as LocationsState;
        }),
    }),
    {
      name: 'weather-locations',
      storage: createJSONStorage(() => storage),
      /*
        v1：載入時去重。

        addLocation 的防護只擋「之後」的重複 —— 使用者裝置上已經存了重複地點
        （在防護只比對浮點座標的時期加入的），不在載入時清掉的話它們會永遠留著。
      */
      version: 1,
      migrate: (persisted) => {
        const state = persisted as Partial<LocationsState>;
        const savedLocations = dedupeLocations(state.savedLocations ?? []);
        return {
          ...state,
          savedLocations,
          // 去重後 selectedLocation 可能指向被移除的那筆 —— 重新對齊到保留的等價項
          selectedLocation:
            state.selectedLocation !== null && state.selectedLocation !== undefined
              ? (savedLocations.find((loc) =>
                  isSameLocation(loc, state.selectedLocation as Location),
                ) ?? state.selectedLocation)
              : null,
        } as LocationsState;
      },
    },
  ),
);
