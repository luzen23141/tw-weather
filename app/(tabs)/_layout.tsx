import { Tabs } from 'expo-router';
import { Platform } from 'react-native';

import { AppIcon } from '@/components/icons/AppIcon';
import { getGlassStyle } from '@/components/ui/glass';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#93b4ff',
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.5)',
        sceneStyle: { flex: 1, minHeight: 0 },
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'rgba(20, 32, 65, 0.65)',
          borderTopWidth: 0,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
          position: 'absolute',
          bottom: Platform.OS === 'web' ? 12 : 0,
          left: Platform.OS === 'web' ? '50%' : 0,
          right: Platform.OS === 'web' ? 'auto' : 0,
          ...(Platform.OS === 'web'
            ? {
                transform: [{ translateX: '-50%' }] as unknown as string,
                maxWidth: 420,
                width: '92%',
                borderRadius: 24,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.12)',
              }
            : {
                borderTopColor: 'rgba(255, 255, 255, 0.08)',
                borderTopWidth: 1,
              }),
          ...getGlassStyle(24),
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
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
        }}
      />

      <Tabs.Screen
        name="forecast"
        options={{
          title: '預報',
          tabBarIcon: ({ color, size }) => (
            <AppIcon name="calendar-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="history"
        options={{
          title: '歷史',
          tabBarIcon: ({ color, size }) => (
            <AppIcon name="time-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="locations"
        options={{
          title: '地點',
          tabBarIcon: ({ color, size }) => (
            <AppIcon name="location-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: '設定',
          tabBarIcon: ({ color, size }) => (
            <AppIcon name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
