import '../global.css';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme, vars } from 'nativewind';
import { useEffect, useState } from 'react';
import { LogBox, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { historyCache } from '@/cache/history-cache';
import { getMDColors } from '@/hooks/useMDColors';
import { useSettingsStore } from '@/store/settings.store';

// Suppress all LogBox warnings during tests so they don't block Maestro UI interactions
LogBox.ignoreAllLogs(true);

// 判斷是否在瀏覽器環境（非 SSR / expo export 靜態渲染）
const isBrowser = typeof window !== 'undefined';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      retry: 2,
    },
  },
});

// 僅在瀏覽器中建立 persister；SSR 環境不需要也不能使用持久化
const asyncStoragePersister = isBrowser
  ? createAsyncStoragePersister({ storage: AsyncStorage })
  : null;

function AppContent() {
  const theme = useSettingsStore((state) => state.theme);
  const { colorScheme, setColorScheme } = useColorScheme();
  const resolvedTheme = colorScheme === 'dark' ? 'dark' : 'light';
  const colors = getMDColors(resolvedTheme);

  // 將 MDColors 轉換為 NativeWind 變數
  const themeVars = vars({
    '--color-md-primary': colors.primary,
    '--color-md-on-primary': colors.onPrimary,
    '--color-md-primary-container': colors.primaryContainer,
    '--color-md-on-primary-container': colors.onPrimaryContainer,
    '--color-md-secondary': colors.secondary,
    '--color-md-secondary-container': colors.secondaryContainer,
    '--color-md-on-secondary-container': colors.onSecondaryContainer,
    '--color-md-tertiary': colors.tertiary,
    '--color-md-on-tertiary': colors.onTertiary,
    '--color-md-tertiary-container': colors.tertiaryContainer,
    '--color-md-on-tertiary-container': colors.onTertiaryContainer,
    '--color-md-background': colors.background,
    '--color-md-on-background': colors.onBackground,
    '--color-md-surface': colors.surface,
    '--color-md-on-surface': colors.onSurface,
    '--color-md-surface-variant': colors.surfaceVariant,
    '--color-md-on-surface-variant': colors.onSurfaceVariant,
    '--color-md-surface-container-low': colors.surfaceContainerLow,
    '--color-md-surface-container': colors.surfaceContainer,
    '--color-md-outline': colors.outline,
    '--color-md-error': colors.error,
    '--color-md-on-error': colors.onError,
    '--color-md-error-container': colors.errorContainer,
    '--color-md-on-error-container': colors.onErrorContainer,
    '--color-glass-border': colors.glassBorder,
    '--color-glass-border-strong': colors.glassBorderStrong,
  });

  useEffect(() => {
    setColorScheme(theme);
  }, [setColorScheme, theme]);

  useEffect(() => {
    // App 啟動時清理過期的快取
    void historyCache.cleanup(30);
  }, []);

  return (
    <View style={themeVars} className="flex-1">
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
      <StatusBar style={resolvedTheme === 'dark' ? 'light' : 'dark'} />
    </View>
  );
}

export default function RootLayout() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  // 靜態預渲染（expo export）在 Node.js 中執行，window 不存在。
  // PersistQueryClientProvider 內部使用 throttle + setTimeout 訂閱 query cache，
  // 會讓 Node.js event loop 無法退出，導致 expo export 無限懸掛。
  // SSR 路徑改用純 QueryClientProvider，不啟動任何計時器。
  if (!isMounted || !isBrowser || !asyncStoragePersister) {
    return (
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AppContent />
        </QueryClientProvider>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister: asyncStoragePersister,
          maxAge: 30 * 60 * 1000, // 30 minutes
        }}
      >
        <AppContent />
      </PersistQueryClientProvider>
    </SafeAreaProvider>
  );
}
