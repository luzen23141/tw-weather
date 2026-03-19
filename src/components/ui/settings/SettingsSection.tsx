import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { AppIcon, type AppIconName } from '@/components/icons/AppIcon';
import { getGlassStyle } from '@/components/ui/glass';

type SettingsSectionProps = {
  icon: AppIconName;
  title: string;
  summary?: string | undefined;
  children: ReactNode;
  footer?: ReactNode;
};

const sectionCardStyle = getGlassStyle(20);

export function SettingsSection({ icon, title, summary, children, footer }: SettingsSectionProps) {
  return (
    <View className="mx-4 gap-2.5">
      <View className="flex-row items-center gap-2.5">
        <View className="h-7 w-7 items-center justify-center rounded-lg border border-white/14 bg-white/10 dark:border-white/10 dark:bg-white/8">
          <AppIcon name={icon} size={15} color="var(--color-md-primary)" />
        </View>
        <Text className="flex-1 text-[15px] font-bold leading-5 text-md-on-surface/80">
          {title}
        </Text>
        {summary ? (
          <View className="rounded-full border border-white/16 bg-white/14 px-2.5 py-0.5 dark:border-white/10 dark:bg-white/8">
            <Text className="text-[11px] font-semibold leading-4 text-md-on-surface">
              {summary}
            </Text>
          </View>
        ) : null}
      </View>

      <View
        className="overflow-hidden rounded-2xl border border-white/16 bg-white/14 shadow-glass dark:border-white/10 dark:bg-white/8"
        style={sectionCardStyle}
      >
        <View className="absolute inset-x-0 top-0 h-px bg-white/24 dark:bg-white/12" />
        {children}
        {footer ? <View className="border-t border-glass-border px-5 py-3">{footer}</View> : null}
      </View>
    </View>
  );
}

export function SummaryNote({ children }: { children: ReactNode }) {
  return <Text className="text-[12px] leading-[18px] text-md-on-surface-variant">{children}</Text>;
}
