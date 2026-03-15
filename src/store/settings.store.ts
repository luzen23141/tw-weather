import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import {
  DEFAULT_AGGREGATION_CONFIG,
  type AggregationConfig,
  type WeatherSource,
} from '@/api/types';
import { DEFAULT_ACTIVE_SOURCE, DEFAULT_ENABLED_SOURCES } from '@/api/sources';
import { storage } from '@/cache/storage';

export type ThemeMode = 'light' | 'dark';

export interface SettingsState {
  // 外觀設定
  theme: ThemeMode;

  // 資料源與聚合設定
  displayMode: 'single' | 'aggregate';
  activeSource: WeatherSource;
  enabledSources: WeatherSource[];
  aggregationConfig: AggregationConfig;

  // Action
  setTheme: (theme: ThemeMode) => void;
  setDisplayMode: (mode: SettingsState['displayMode']) => void;
  setActiveSource: (source: WeatherSource) => void;
  toggleSource: (source: WeatherSource) => void;
  setAggregationConfig: (config: AggregationConfig) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // 初始值
      theme: 'light' as ThemeMode,
      displayMode: 'single',
      activeSource: DEFAULT_ACTIVE_SOURCE,
      enabledSources: DEFAULT_ENABLED_SOURCES,
      aggregationConfig: DEFAULT_AGGREGATION_CONFIG,

      // Actions
      setTheme: (theme: ThemeMode) => set({ theme }),
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
      setAggregationConfig: (config) => set({ aggregationConfig: config }),
    }),
    {
      name: 'weather-settings',
      storage: createJSONStorage(() => storage),
      partialize: ({ theme, displayMode, activeSource, enabledSources, aggregationConfig }) => ({
        theme,
        displayMode,
        activeSource,
        enabledSources,
        aggregationConfig,
      }),
    },
  ),
);
