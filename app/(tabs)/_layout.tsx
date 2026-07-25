import { Tabs } from 'expo-router';

import { GlassTabBar } from '@/components/ui/GlassTabBar';
import { useWeatherPage } from '@/hooks/useWeatherPage';

/**
 * Tabs layout。
 *
 * 導航欄改為自繪（`tabBar` prop）而非設定 `tabBarStyle`：收合動畫需要把
 * `Animated.View` 掛在導航欄上，而 `tabBarStyle` 只吃靜態 style。
 * 詳見 `src/components/ui/GlassTabBar.tsx`。
 */
export default function TabsLayout() {
  // 收合後導航欄會帶出當前地點，讓使用者縮小後仍知道自己在看哪裡。
  // 這裡讀的是同一份 query cache，不會額外觸發請求。
  const { primaryDisplayName } = useWeatherPage();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { flex: 1, minHeight: 0 },
      }}
      tabBar={(props) => <GlassTabBar {...props} collapsedLabel={primaryDisplayName} />}
    >
      {/*
        原本的「預報」分頁已移除：它只渲染 DailyForecastList，而首頁的每日預報
        已涵蓋昨日 + 今日 + 未來 7 天並附降雨機率與溫度區間 —— 它是首頁的嚴格
        子集，且資訊更少。單日的深入資訊改走下鑽路由（見 app/day/[date].tsx）。

        「地點」保留為一級分頁：地點聚合（例如同時關心住家與通勤目的地）規劃為
        核心功能，它不是設定一次就不動的管理頁。
      */}
      <Tabs.Screen name="index" options={{ title: '天氣' }} />
      <Tabs.Screen name="history" options={{ title: '歷史' }} />
      <Tabs.Screen name="locations" options={{ title: '地點' }} />
      <Tabs.Screen name="settings" options={{ title: '設定' }} />
    </Tabs>
  );
}
