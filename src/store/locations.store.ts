import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import type { Location } from '@/api/types';

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
          // 避免重複新增
          const exists = state.savedLocations.some(
            (loc) => loc.latitude === location.latitude && loc.longitude === location.longitude,
          );

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
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
