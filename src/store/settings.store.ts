import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import type { WeatherSource } from '@/api/types';
import { storage } from '@/cache/storage';

export interface SettingsState {
  // 資料源與聚合設定
  displayMode: 'single' | 'aggregate';
  activeSource: WeatherSource;
  enabledSources: WeatherSource[];

  // Action
  setDisplayMode: (mode: SettingsState['displayMode']) => void;
  setActiveSource: (source: WeatherSource) => void;
  toggleSource: (source: WeatherSource) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // 初始值
      displayMode: 'single',
      activeSource: 'cwa',
      enabledSources: ['cwa', 'open-meteo'],

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
    }),
    {
      name: 'weather-settings',
      storage: createJSONStorage(() => storage),
      partialize: ({ displayMode, activeSource, enabledSources }) => ({
        displayMode,
        activeSource,
        enabledSources,
      }),
    },
  ),
);
