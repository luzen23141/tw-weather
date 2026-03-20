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
        <View className="h-8 w-8 items-center justify-center rounded-xl border border-white/20 bg-white/12">
          <AppIcon name={icon} size={15} color="var(--color-md-primary)" />
        </View>
        <Text className="flex-1 text-[15px] font-bold leading-5 tracking-tight text-md-on-surface/86">
          {title}
        </Text>
        {summary ? (
          <View className="rounded-full border border-white/20 bg-white/12 px-2.5 py-0.5">
            <Text className="text-[11px] font-semibold leading-4 text-md-on-surface/90">
              {summary}
            </Text>
          </View>
        ) : null}
      </View>

      <View
        className="overflow-hidden rounded-[28px] border border-white/20 bg-white/14 shadow-glass"
        style={sectionCardStyle}
      >
        <View className="absolute inset-x-0 top-0 h-px bg-white/30" />
        {children}
        {footer ? <View className="border-t border-white/12 px-5 py-3">{footer}</View> : null}
      </View>
    </View>
  );
}

export function SummaryNote({ children }: { children: ReactNode }) {
  return <Text className="text-[12px] leading-[18px] text-md-on-surface-variant">{children}</Text>;
}
