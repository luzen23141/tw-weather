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
      style={[{ width: '48.5%' }, getGlassStyle(16)]}
      className="rounded-[26px] border border-glass-border-strong bg-md-surface px-4 py-4 gap-3"
    >
      <View className="flex-row items-center gap-2">
        <View
          className="h-8 w-8 items-center justify-center rounded-2xl"
          style={{ backgroundColor: `${iconColor}1A` }}
        >
          <StatIcon type={iconType} size={16} color={iconColor} />
        </View>
        <Text className="text-xs font-medium text-md-on-surface-variant">{label}</Text>
      </View>
      <Text className={`text-xl font-bold text-md-on-surface ${valueClassName}`.trim()}>
        {value}
      </Text>
    </View>
  );
}
