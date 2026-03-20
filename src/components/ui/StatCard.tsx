import { Text, View } from 'react-native';

import { type StatIconType, StatIcon } from '@/components/icons/StatIcon';
import { getGlassStyle } from '@/components/ui/glass';

export interface StatCardProps {
  iconType: StatIconType;
  label: string;
  value: string;
  iconColor: string;
}

export function StatCard({ iconType, label, value, iconColor }: StatCardProps) {
  return (
    <View
      style={[{ flexBasis: '47%', flexGrow: 1 }, getGlassStyle(16)]}
      className="rounded-[24px] border border-white/18 bg-white/10 px-4 py-3.5 gap-2.5"
    >
      <View className="flex-row items-center gap-2.5">
        <View
          className="h-7 w-7 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${iconColor}18` }}
        >
          <StatIcon type={iconType} size={14} color={iconColor} />
        </View>
        <Text className="text-[10px] font-bold uppercase tracking-[1px] text-md-on-surface-variant/82">
          {label}
        </Text>
      </View>
      <Text className="text-[19px] font-bold tracking-tight text-md-on-surface">{value}</Text>
    </View>
  );
}
