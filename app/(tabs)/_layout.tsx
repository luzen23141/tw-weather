import { Tabs } from 'expo-router';
import { Platform, View } from 'react-native';

import { AppIcon } from '@/components/icons/AppIcon';
import { getGlassStyle } from '@/components/ui/glass';

export default function TabsLayout() {
  const renderTabIcon = (name: Parameters<typeof AppIcon>[0]['name']) => {
    return ({ color, size, focused }: { color: string; size: number; focused: boolean }) => (
      <View
        style={{
          minWidth: 40,
          height: 40,
          borderRadius: 999,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: focused ? 'rgba(255,255,255,0.16)' : 'transparent',
          borderWidth: focused ? 1 : 0,
          borderColor: focused ? 'rgba(255,255,255,0.22)' : 'transparent',
          transform: [{ scale: focused ? 1 : 0.98 }],
        }}
      >
        <AppIcon name={name} size={size} color={color} />
      </View>
    );
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: 'rgba(255, 255, 255, 0.92)',
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.58)',
        tabBarShowLabel: false,
        sceneStyle: { flex: 1, minHeight: 0 },
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'rgba(255, 255, 255, 0.14)',
          borderTopWidth: 0,
          height: 64,
          paddingBottom: 10,
          paddingTop: 10,
          position: 'absolute',
          bottom: Platform.OS === 'web' ? 12 : 0,
          left: Platform.OS === 'web' ? '50%' : 0,
          right: Platform.OS === 'web' ? 'auto' : 0,
          ...(Platform.OS === 'web'
            ? {
                transform: [{ translateX: '-50%' }] as unknown as string,
                maxWidth: 360,
                width: '84%',
                borderRadius: 999,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.24)',
              }
            : {
                borderTopColor: 'rgba(255, 255, 255, 0.18)',
                borderTopWidth: 1,
              }),
          shadowColor: '#1d2d66',
          shadowOpacity: 0.2,
          shadowRadius: 20,
          shadowOffset: { width: 0, height: 8 },
          elevation: 0,
          ...getGlassStyle(20),
        },
        tabBarItemStyle: {
          marginHorizontal: 4,
          borderRadius: 999,
        },
        tabBarIconStyle: {
          marginBottom: 0,
        },
        tabBarActiveBackgroundColor: 'rgba(255, 255, 255, 0.14)',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '天氣',
          tabBarIcon: renderTabIcon('partly-sunny-outline'),
        }}
      />

      <Tabs.Screen
        name="forecast"
        options={{
          title: '預報',
          tabBarIcon: renderTabIcon('calendar-outline'),
        }}
      />

      <Tabs.Screen
        name="history"
        options={{
          title: '歷史',
          tabBarIcon: renderTabIcon('time-outline'),
        }}
      />

      <Tabs.Screen
        name="locations"
        options={{
          title: '地點',
          tabBarIcon: renderTabIcon('location-outline'),
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: '設定',
          tabBarIcon: renderTabIcon('options-outline'),
        }}
      />
    </Tabs>
  );
}
