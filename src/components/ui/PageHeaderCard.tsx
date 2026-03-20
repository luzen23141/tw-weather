import { Text, View } from 'react-native';

import { AppIcon, type AppIconName } from '@/components/icons/AppIcon';
import { getGlassStyle } from '@/components/ui/glass';

export interface PageHeaderCardProps {
  icon: AppIconName;
  title: string;
  subtitle?: string | null;
  eyebrow?: string;
  rightSlot?: React.ReactNode;
  bottomSlot?: React.ReactNode;
}

export function PageHeaderCard({
  icon,
  title,
  subtitle,
  eyebrow,
  rightSlot,
  bottomSlot,
}: PageHeaderCardProps) {
  return (
    <View
      className="mx-4 overflow-hidden rounded-[30px] border border-white/22 bg-white/16 px-5 py-4 shadow-glass"
      style={getGlassStyle(20)}
    >
      <View className="absolute inset-x-0 top-0 h-px bg-white/32" />
      <View className="flex-row items-start gap-4">
        <View className="mt-0.5 h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/12">
          <AppIcon name={icon} size={22} color="var(--color-md-primary)" />
        </View>
        <View className="flex-1 gap-1">
          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-1">
              {eyebrow ? (
                <Text className="mb-1 text-[10px] font-bold uppercase tracking-[1.8px] text-md-primary">
                  {eyebrow}
                </Text>
              ) : null}
              <Text className="text-[22px] font-bold leading-7 tracking-tight text-md-on-surface">
                {title}
              </Text>
              {subtitle ? (
                <Text className="mt-1 text-[13px] font-medium leading-5 text-md-on-surface-variant/88">
                  {subtitle}
                </Text>
              ) : null}
            </View>
            {rightSlot ? <View>{rightSlot}</View> : null}
          </View>
          {bottomSlot ? <View className="pt-1">{bottomSlot}</View> : null}
        </View>
      </View>
    </View>
  );
}
