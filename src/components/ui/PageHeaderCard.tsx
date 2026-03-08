import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

export interface PageHeaderCardProps {
  icon: keyof typeof Ionicons.glyphMap;
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
    <View className="mx-4 mt-1 rounded-3xl border border-glass-border-strong bg-md-surface-container px-5 py-5 shadow-glass">
      <View className="flex-row items-start gap-3">
        <View className="mt-0.5 h-11 w-11 items-center justify-center rounded-2xl border border-glass-border bg-md-primary/12">
          <Ionicons name={icon} size={20} color="var(--color-md-primary)" />
        </View>
        <View className="flex-1 gap-1.5">
          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-1">
              <Text className="text-lg font-bold text-md-on-surface">{title}</Text>
              {subtitle ? (
                <Text className="mt-1 text-sm leading-5 text-md-on-surface-variant">{subtitle}</Text>
              ) : null}
            </View>
            {rightSlot ? <View>{rightSlot}</View> : null}
          </View>
          {eyebrow ? (
            <Text className="text-xs font-bold uppercase tracking-[1.6px] text-md-primary">{eyebrow}</Text>
          ) : null}
          {bottomSlot ? <View className="pt-1">{bottomSlot}</View> : null}
        </View>
      </View>
    </View>
  );
}
