import { Tabs } from 'expo-router';
import { Platform } from 'react-native';

import { AppIcon } from '@/components/icons/AppIcon';
import { getGlassStyle } from '@/components/ui/glass';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: 'rgba(255, 255, 255, 0.92)',
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.52)',
        tabBarShowLabel: false,
        sceneStyle: { flex: 1, minHeight: 0 },
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'rgba(255, 255, 255, 0.16)',
          borderTopWidth: 0,
          height: 56,
          paddingBottom: 8,
          paddingTop: 8,
          position: 'absolute',
          bottom: Platform.OS === 'web' ? 12 : 0,
          left: Platform.OS === 'web' ? '50%' : 0,
          right: Platform.OS === 'web' ? 'auto' : 0,
          ...(Platform.OS === 'web'
            ? {
                transform: [{ translateX: '-50%' }] as unknown as string,
                maxWidth: 320,
                width: '80%',
                borderRadius: 999,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.18)',
              }
            : {
                borderTopColor: 'rgba(255, 255, 255, 0.12)',
                borderTopWidth: 1,
              }),
          ...getGlassStyle(20),
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
            <AppIcon name="options-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
