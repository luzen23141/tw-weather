import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import type {
  LocationDisplayFormat,
  TemperatureUnit,
  WeatherSource,
  WindSpeedUnit,
} from '@/api/types';

export interface SettingsState {
  // 主題設定
  theme: 'light' | 'dark' | 'system';

  // 單位設定
  temperatureUnit: TemperatureUnit;
  windSpeedUnit: WindSpeedUnit;

  // 地點顯示格式
  locationDisplayFormat: LocationDisplayFormat;

  // 資料源與聚合設定
  displayMode: 'single' | 'aggregate';
  activeSource: WeatherSource;
  enabledSources: WeatherSource[];

  // Action
  setTheme: (theme: SettingsState['theme']) => void;
  setTemperatureUnit: (unit: TemperatureUnit) => void;
  setWindSpeedUnit: (unit: WindSpeedUnit) => void;
  setLocationDisplayFormat: (format: LocationDisplayFormat) => void;
  setDisplayMode: (mode: SettingsState['displayMode']) => void;
  setActiveSource: (source: WeatherSource) => void;
  toggleSource: (source: WeatherSource) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // 初始值
      theme: 'system',
      temperatureUnit: 'celsius',
      windSpeedUnit: 'kmh',
      locationDisplayFormat: 'township',
      displayMode: 'single',
      activeSource: 'cwa',
      enabledSources: ['cwa', 'open-meteo'],

      // Actions
      setTheme: (theme) => set({ theme }),
      setTemperatureUnit: (unit) => set({ temperatureUnit: unit }),
      setWindSpeedUnit: (unit) => set({ windSpeedUnit: unit }),
      setLocationDisplayFormat: (format) => set({ locationDisplayFormat: format }),
      setDisplayMode: (mode) => set({ displayMode: mode }),
      setActiveSource: (source) => set({ activeSource: source }),
      toggleSource: (source) =>
        set((state) => {
          const enabledSources = state.enabledSources.includes(source)
            ? state.enabledSources.filter((item) => item !== source)
            : [...state.enabledSources, source];

          if (enabledSources.length === 0) {
            return state;
          }

          if (enabledSources.includes(state.activeSource)) {
            return { enabledSources };
          }

          const nextActiveSource = enabledSources[0];
          return nextActiveSource === undefined
            ? state
            : {
                enabledSources,
                activeSource: nextActiveSource,
              };
        }),
    }),
    {
      name: 'weather-settings',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({
        theme,
        temperatureUnit,
        windSpeedUnit,
        locationDisplayFormat,
        displayMode,
        activeSource,
        enabledSources,
      }) => ({
        theme,
        temperatureUnit,
        windSpeedUnit,
        locationDisplayFormat,
        displayMode,
        activeSource,
        enabledSources,
      }),
    },
  ),
);
