import { Tabs } from 'expo-router';
import { Platform } from 'react-native';

import { AppIcon } from '@/components/icons/AppIcon';
import { useMDColors } from '@/hooks/useMDColors';
import { getGlassStyle } from '@/components/ui/glass';

export default function TabsLayout() {
  const colors = useMDColors();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.6)',
        sceneStyle: Platform.OS === 'web' ? { flex: 1, minHeight: 0 } : undefined,
        tabBarStyle: {
          backgroundColor: colors.glassTab,
          borderTopColor: 'rgba(255, 255, 255, 0.15)',
          borderTopWidth: 1,
          height: 62,
          paddingBottom: 8,
          paddingTop: 4,
          position: Platform.OS === 'web' ? 'relative' : 'absolute',
          ...getGlassStyle(20),
          ...(Platform.OS === 'web'
            ? {
                alignSelf: 'center',
                marginTop: 'auto',
                marginBottom: 10,
                maxWidth: 560,
                width: '100%',
                borderRadius: 28,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.18)',
              }
            : {}),
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
        },
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.glassHeader,
          borderBottomColor: 'rgba(255, 255, 255, 0.1)',
          borderBottomWidth: 1,
          ...getGlassStyle(16),
        },
        headerShadowVisible: false,
        headerTintColor: colors.onSurface,
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 19,
          letterSpacing: 0.2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '天氣',
          tabBarIcon: ({ color, size }) => (
            <AppIcon name="partly-sunny-outline" size={size} color={color} />
          ),
          headerTitle: '台灣天氣',
        }}
      />

      <Tabs.Screen
        name="forecast"
        options={{
          title: '預報',
          tabBarIcon: ({ color, size }) => (
            <AppIcon name="calendar-outline" size={size} color={color} />
          ),
          headerTitle: '天氣預報',
        }}
      />

      <Tabs.Screen
        name="history"
        options={{
          title: '歷史',
          tabBarIcon: ({ color, size }) => (
            <AppIcon name="time-outline" size={size} color={color} />
          ),
          headerTitle: '歷史天氣',
        }}
      />

      <Tabs.Screen
        name="locations"
        options={{
          title: '地點',
          tabBarIcon: ({ color, size }) => (
            <AppIcon name="location-outline" size={size} color={color} />
          ),
          headerTitle: '地點管理',
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: '設定',
          tabBarIcon: ({ color, size }) => (
            <AppIcon name="settings-outline" size={size} color={color} />
          ),
          headerTitle: '設定',
        }}
      />
    </Tabs>
  );
}
