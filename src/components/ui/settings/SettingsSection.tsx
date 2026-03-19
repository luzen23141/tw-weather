import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { AppIcon, type AppIconName } from '@/components/icons/AppIcon';
import { getGlassStyle } from '@/components/ui/glass';

type SettingsSectionProps = {
  icon: AppIconName;
  title: string;
  description?: string | undefined;
  summary?: string | undefined;
  children: ReactNode;
  footer?: ReactNode;
};

const sectionCardClassName =
  'overflow-hidden rounded-3xl border border-glass-border-strong bg-md-surface shadow-glass';
const sectionCardStyle = getGlassStyle(20);

export function SettingsSection({
  icon,
  title,
  description,
  summary,
  children,
  footer,
}: SettingsSectionProps) {
  return (
    <View className="gap-3">
      <View className="px-1">
        <View className="flex-row items-start gap-3">
          <View className="mt-0.5 h-10 w-10 items-center justify-center rounded-2xl border border-glass-border-strong bg-md-primary/12">
            <AppIcon name={icon} size={18} color="var(--color-md-primary)" />
          </View>
          <View className="flex-1 gap-1">
            <View className="flex-row items-center justify-between gap-3">
              <Text className="text-[18px] font-semibold leading-6 text-md-on-surface">
                {title}
              </Text>
              {summary ? (
                <View className="rounded-full border border-glass-border-strong bg-md-surface-variant px-3 py-1">
                  <Text className="text-[11px] font-semibold leading-4 text-md-on-surface">
                    {summary}
                  </Text>
                </View>
              ) : null}
            </View>
            {description ? (
              <Text className="text-[13px] leading-5 text-md-on-surface-variant">
                {description}
              </Text>
            ) : null}
          </View>
        </View>
      </View>

      <View className={sectionCardClassName} style={sectionCardStyle}>
        {children}
        {footer ? <View className="border-t border-glass-border px-5 py-3">{footer}</View> : null}
      </View>
    </View>
  );
}

export function SummaryNote({ children }: { children: ReactNode }) {
  return <Text className="text-[12px] leading-[18px] text-md-on-surface-variant">{children}</Text>;
}
