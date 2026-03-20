import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  DEFAULT_AGGREGATION_CONFIG,
  type AggregationConfig,
  type WeatherSource,
} from '@/api/types';
import { DEFAULT_ACTIVE_SOURCE, DEFAULT_ENABLED_SOURCES } from '@/api/sources';
import { storage } from '@/cache/storage';

export interface SettingsState {
  // 資料源與聚合設定
  displayMode: 'single' | 'aggregate';
  activeSource: WeatherSource;
  enabledSources: WeatherSource[];
  aggregationConfig: AggregationConfig;

  // Action
  setDisplayMode: (mode: SettingsState['displayMode']) => void;
  setActiveSource: (source: WeatherSource) => void;
  toggleSource: (source: WeatherSource) => void;
  setAggregationConfig: (config: AggregationConfig) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // 初始值
      displayMode: 'single',
      activeSource: DEFAULT_ACTIVE_SOURCE,
      enabledSources: DEFAULT_ENABLED_SOURCES,
      aggregationConfig: DEFAULT_AGGREGATION_CONFIG,

      // Actions
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
      partialize: ({ displayMode, activeSource, enabledSources, aggregationConfig }) => ({
        displayMode,
        activeSource,
        enabledSources,
        aggregationConfig,
      }),
    },
  ),
);
