import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';

import { useMDColors } from '@/hooks/useMDColors';
import { getGlassStyle } from '@/utils/glass';

export default function TabsLayout() {
  const colors = useMDColors();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.onSurfaceVariant,
        sceneStyle: Platform.OS === 'web' ? { flex: 1, minHeight: 0 } : undefined,
        tabBarStyle: {
          backgroundColor: colors.glassTab,
          borderTopColor: colors.glassBorder,
          borderTopWidth: 1,
          height: 62,
          paddingBottom: 8,
          paddingTop: 4,
          position: Platform.OS === 'web' ? 'relative' : 'absolute',
          ...(Platform.OS === 'web'
            ? {
                marginTop: 'auto',
                ...getGlassStyle(24),
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
          borderBottomColor: colors.glassBorder,
          borderBottomWidth: 1,
        },
        headerShadowVisible: false,
        headerTintColor: colors.onSurface,
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 17,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '天氣',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="partly-sunny-outline" size={size} color={color} />
          ),
          headerTitle: '台灣天氣',
        }}
      />

      <Tabs.Screen
        name="forecast"
        options={{
          title: '預報',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
          headerTitle: '天氣預報',
        }}
      />

      <Tabs.Screen
        name="history"
        options={{
          title: '歷史',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time-outline" size={size} color={color} />
          ),
          headerTitle: '歷史天氣',
        }}
      />

      <Tabs.Screen
        name="locations"
        options={{
          title: '地點',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="location-outline" size={size} color={color} />
          ),
          headerTitle: '地點管理',
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: '設定',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
          headerTitle: '設定',
        }}
      />
    </Tabs>
  );
}
