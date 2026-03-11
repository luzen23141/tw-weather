import '../global.css';

declare global {
  interface Window {
    importMeta?: {
      url: string;
    };
  }
}

// 注入 Polyfill 以防止 ESM 套件中的 import.meta 導致 Web 崩潰
if (typeof window !== 'undefined' && typeof window.importMeta === 'undefined') {
  window.importMeta = { url: window.location.href };
}

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { VariableContextProvider } from 'nativewind';
import { useEffect, useState } from 'react';
import { LogBox, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { historyCache } from '@/cache/history-cache';
import { LIGHT } from '@/hooks/useMDColors';

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

const themeVariables = {
  '--color-md-primary': LIGHT.primary,
  '--color-md-on-primary': LIGHT.onPrimary,
  '--color-md-primary-container': LIGHT.primaryContainer,
  '--color-md-on-primary-container': LIGHT.onPrimaryContainer,
  '--color-md-secondary': LIGHT.secondary,
  '--color-md-secondary-container': LIGHT.secondaryContainer,
  '--color-md-on-secondary-container': LIGHT.onSecondaryContainer,
  '--color-md-tertiary': LIGHT.tertiary,
  '--color-md-on-tertiary': LIGHT.onTertiary,
  '--color-md-tertiary-container': LIGHT.tertiaryContainer,
  '--color-md-on-tertiary-container': LIGHT.onTertiaryContainer,
  '--color-md-background': LIGHT.background,
  '--color-md-on-background': LIGHT.onBackground,
  '--color-md-surface': LIGHT.surface,
  '--color-md-on-surface': LIGHT.onSurface,
  '--color-md-surface-variant': LIGHT.surfaceVariant,
  '--color-md-on-surface-variant': LIGHT.onSurfaceVariant,
  '--color-md-surface-container-low': LIGHT.surfaceContainerLow,
  '--color-md-surface-container': LIGHT.surfaceContainer,
  '--color-md-outline': LIGHT.outline,
  '--color-md-error': LIGHT.error,
  '--color-md-on-error': LIGHT.onError,
  '--color-md-error-container': LIGHT.errorContainer,
  '--color-md-on-error-container': LIGHT.onErrorContainer,
  '--color-glass-border': LIGHT.glassBorder,
  '--color-glass-border-strong': LIGHT.glassBorderStrong,
} as const;

function AppContent() {
  useEffect(() => {
    // App 啟動時清理過期的快取
    void historyCache.cleanup(30);
  }, []);

  return (
    <VariableContextProvider value={themeVariables}>
      <View className="flex-1">
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        />
        <StatusBar style="dark" />
      </View>
    </VariableContextProvider>
  );
}

export default function RootLayout() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
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
