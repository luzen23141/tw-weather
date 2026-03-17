import { Text, View } from 'react-native';

import { type StatIconType, StatIcon } from '@/components/icons/StatIcon';
import { getGlassStyle } from '@/components/ui/glass';

export interface StatCardProps {
  iconType: StatIconType;
  label: string;
  value: string;
  iconColor: string;
  valueClassName?: string;
}

export function StatCard({
  iconType,
  label,
  value,
  iconColor,
  valueClassName = '',
}: StatCardProps) {
  return (
    <View
      style={[{ flexBasis: '47%', flexGrow: 1 }, getGlassStyle(16)]}
      className="rounded-[22px] border border-glass-border bg-md-surface/80 px-4 py-3.5 gap-2.5"
    >
      <View className="flex-row items-center gap-2.5">
        <View
          className="h-7 w-7 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${iconColor}18` }}
        >
          <StatIcon type={iconType} size={14} color={iconColor} />
        </View>
        <Text className="text-[11px] font-semibold uppercase tracking-[0.5px] text-md-on-surface-variant">
          {label}
        </Text>
      </View>
      <Text
        className={`text-lg font-bold tracking-tight text-md-on-surface ${valueClassName}`.trim()}
      >
        {value}
      </Text>
    </View>
  );
}
