import React from 'react';
import { Text } from 'react-native';

export interface SectionLabelProps {
  children: string;
}

/**
 * 區塊標題（逐時預報、每日預報、選擇日期……）。
 *
 * 刻意做得很輕：9px、低對比、寬字距。它的工作是標示邊界，不是吸引注意 ——
 * 真正該被看見的是它底下的內容。
 */
export const SectionLabel = React.memo(function SectionLabel({
  children,
}: SectionLabelProps): React.ReactElement {
  return (
    <Text className="px-4 text-[9px] tracking-[1.2px] text-md-on-surface-variant/70">
      {children}
    </Text>
  );
});
