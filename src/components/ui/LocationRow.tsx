import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { getGlassStyle } from '@/components/ui/glass';

export interface LocationRowProps {
  primary: string;
  secondary: string;
  /** 列表最後一列不畫底部分隔線 */
  isLast?: boolean;
  isSelected?: boolean;
  onPress?: (() => void) | undefined;
  accessibilityLabel?: string | undefined;
  trailing?: React.ReactNode;
}

/**
 * 地點列。
 *
 * 先前每一列都是獨立的浮動卡片（`rounded-[28px]` + 12px 間距），十個地點就是十張
 * 卡片各自為政，掃視時眼睛要不斷重新定位。改為單一玻璃容器內以細分隔線分列，
 * 與每日預報、設定頁同一套結構。
 *
 * 選取狀態沿用「玻璃上的透鏡」：同材質再疊一層並補上緣高光，而非換一個底色。
 */
export const LocationRow = React.memo(function LocationRow({
  primary,
  secondary,
  isLast = false,
  isSelected = false,
  onPress,
  accessibilityLabel,
  trailing,
}: LocationRowProps): React.ReactElement {
  const content = (
    <View className="flex-1">
      <Text
        className={`text-[15px] text-md-on-surface ${isSelected ? 'font-medium' : ''}`}
        numberOfLines={1}
      >
        {primary}
      </Text>
      <Text className="mt-0.5 text-[12px] text-md-on-surface-variant" numberOfLines={1}>
        {secondary}
      </Text>
    </View>
  );

  return (
    <View className="mx-4">
      <View
        className={`flex-row items-center gap-2 px-3 ${
          isSelected ? 'rounded-[14px] border-t border-white/[0.42] bg-white/[0.26] py-2' : 'py-2.5'
        }`}
        style={isSelected ? getGlassStyle(16) : undefined}
      >
        {onPress !== undefined ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
            accessibilityState={{ selected: isSelected }}
            onPress={onPress}
            className="flex-1"
          >
            {content}
          </Pressable>
        ) : (
          content
        )}
        {trailing}
      </View>
      {/* 選取列自帶 pill 邊界，再畫分隔線會與圓角打架 */}
      {!isLast && !isSelected ? <View className="h-px bg-white/12" /> : null}
    </View>
  );
});
