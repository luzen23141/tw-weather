import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import type { AggregationConfig, TemperatureUnit, WeatherSource, WindSpeedUnit } from '@/api/types';
import { DEFAULT_AGGREGATION_CONFIG } from '@/api/types';

export interface SettingsState {
  // 主題設定
  theme: 'light' | 'dark' | 'system';

  // 單位設定
  temperatureUnit: TemperatureUnit;
  windSpeedUnit: WindSpeedUnit;

  // 資料源與聚合設定
  displayMode: 'single' | 'aggregate';
  activeSource: WeatherSource;
  enabledSources: WeatherSource[];

  // 聚合設定
  useDefaultAggregation: boolean;
  aggregationConfig: AggregationConfig;

  // Action
  setTheme: (theme: SettingsState['theme']) => void;
  setTemperatureUnit: (unit: TemperatureUnit) => void;
  setWindSpeedUnit: (unit: WindSpeedUnit) => void;
  setDisplayMode: (mode: SettingsState['displayMode']) => void;
  setActiveSource: (source: WeatherSource) => void;
  toggleSource: (source: WeatherSource) => void;
  setUseDefaultAggregation: (use: boolean) => void;
  setAggregationConfig: (config: Partial<AggregationConfig>) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // 初始值
      theme: 'system',
      temperatureUnit: 'celsius',
      windSpeedUnit: 'kmh',
      displayMode: 'single',
      activeSource: 'cwa',
      enabledSources: ['cwa', 'open-meteo'],
      useDefaultAggregation: true,
      aggregationConfig: { ...DEFAULT_AGGREGATION_CONFIG },

      // Actions
      setTheme: (theme) => set({ theme }),
      setTemperatureUnit: (unit) => set({ temperatureUnit: unit }),
      setWindSpeedUnit: (unit) => set({ windSpeedUnit: unit }),
      setDisplayMode: (mode) => set({ displayMode: mode }),
      setActiveSource: (source) => set({ activeSource: source }),
      toggleSource: (source) =>
        set((state) => {
          const newEnabled = state.enabledSources.includes(source)
            ? state.enabledSources.filter((s) => s !== source)
            : [...state.enabledSources, source];

          // 防止所有來源被禁用（至少保留一個）
          if (newEnabled.length === 0) {
            return state;
          }

          // 如果切換掉的是當前活躍來源，改為其他來源
          if (!newEnabled.includes(state.activeSource)) {
            return {
              enabledSources: newEnabled,
              activeSource: newEnabled[0],
            } as SettingsState;
          }

          return { enabledSources: newEnabled };
        }),
      setUseDefaultAggregation: (use) => set({ useDefaultAggregation: use }),
      setAggregationConfig: (config) =>
        set((state) => ({
          aggregationConfig: { ...state.aggregationConfig, ...config },
        })),
    }),
    {
      name: 'weather-settings',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
