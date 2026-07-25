import React from 'react';
import { Text, View } from 'react-native';

import { AppIcon } from '@/components/icons/AppIcon';
import { getGlassStyle } from '@/components/ui/glass';

/** 超過此時長即視為過期，需要主動告知使用者 */
const STALE_AFTER_MS = 60 * 60 * 1000;

export interface StaleDataNoteProps {
  /** 資料取得時間（ISO 8601） */
  fetchedAt: string;
  /** 是否正在重新取得 —— 重取中就不必警告，等結果即可 */
  isRefetching?: boolean;
  now?: number;
}

function formatAge(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) return `${minutes} 分鐘前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小時前`;
  return `${Math.floor(hours / 24)} 天前`;
}

/**
 * 過期資料提示。
 *
 * 離線或請求失敗時，TanStack Query 會沿用快取繼續渲染 —— 畫面看起來完全正常，
 * 但數字可能是好幾小時前的。**天氣 app 顯示過期資料而不告知，是有實際後果的**：
 * 使用者會據此決定要不要帶傘。
 *
 * 只在真的過期時才出現，不是常駐元件 —— 正常情況下沒有任何視覺負擔。
 */
export const StaleDataNote = React.memo(function StaleDataNote({
  fetchedAt,
  isRefetching = false,
  now = Date.now(),
}: StaleDataNoteProps): React.ReactElement | null {
  const fetchedTime = new Date(fetchedAt).getTime();
  if (Number.isNaN(fetchedTime)) return null;

  const age = now - fetchedTime;
  if (age < STALE_AFTER_MS || isRefetching) return null;

  return (
    <View
      className="mt-3 flex-row items-center gap-2 rounded-[16px] border border-md-warning/34 bg-md-warning-container px-3 py-2.5"
      style={getGlassStyle(16)}
      accessibilityRole="alert"
    >
      <AppIcon name="alert-circle-outline" size={16} color="#fac775" />
      <Text className="flex-1 text-[12px] text-md-on-surface">
        目前顯示 {formatAge(age)} 的資料，下拉可重新整理
      </Text>
    </View>
  );
});
