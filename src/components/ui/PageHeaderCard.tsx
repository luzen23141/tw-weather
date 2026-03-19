import { Text, View } from 'react-native';

import { AnimatedGradientText } from '@/components/ui/AnimatedGradientText';
import { AnimatedShinyText } from '@/components/ui/AnimatedShinyText';
import { BorderBeam } from '@/components/ui/BorderBeam';
import { AppIcon, type AppIconName } from '@/components/icons/AppIcon';
import { getGlassStyle } from '@/components/ui/glass';

export interface PageHeaderCardProps {
  icon: AppIconName;
  title: string;
  subtitle?: string | null;
  eyebrow?: string;
  rightSlot?: React.ReactNode;
  bottomSlot?: React.ReactNode;
  /** 標題是否使用閃光效果，預設 false */
  shinyTitle?: boolean;
  /** 標題是否使用漸層流動效果，預設 false */
  gradientTitle?: boolean;
  /** 是否顯示邊框光束，預設 false */
  showBeam?: boolean;
}

export function PageHeaderCard({
  icon,
  title,
  subtitle,
  eyebrow,
  rightSlot,
  bottomSlot,
  shinyTitle = false,
  gradientTitle = false,
  showBeam = false,
}: PageHeaderCardProps) {
  return (
    <View
      className="mx-4 overflow-hidden rounded-3xl border border-white/18 bg-white/18 px-5 py-4 shadow-glass dark:border-white/12 dark:bg-white/8"
      style={getGlassStyle(20)}
    >
      <View className="absolute inset-x-0 top-0 h-px bg-white/28 dark:bg-white/14" />
      <View className="flex-row items-start gap-4">
        <View className="mt-0.5 h-12 w-12 items-center justify-center rounded-2xl border border-white/16 bg-white/14 dark:border-white/10 dark:bg-white/8">
          <AppIcon name={icon} size={22} color="var(--color-md-primary)" />
        </View>
        <View className="flex-1 gap-1.5">
          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-1">
              {eyebrow ? (
                <Text className="mb-1 text-[11px] font-bold uppercase tracking-[1.8px] text-md-primary">
                  {eyebrow}
                </Text>
              ) : null}
              {gradientTitle ? (
                <AnimatedGradientText className="text-[22px] font-bold leading-7 text-md-on-surface">
                  {title}
                </AnimatedGradientText>
              ) : shinyTitle ? (
                <AnimatedShinyText className="text-[22px] font-bold leading-7 text-md-on-surface">
                  {title}
                </AnimatedShinyText>
              ) : (
                <Text className="text-[21px] font-bold leading-7 text-md-on-surface">{title}</Text>
              )}
              {subtitle ? (
                <Text className="mt-1 text-[13px] leading-5 text-md-on-surface-variant/90">
                  {subtitle}
                </Text>
              ) : null}
            </View>
            {rightSlot ? <View>{rightSlot}</View> : null}
          </View>
          {bottomSlot ? <View className="pt-1">{bottomSlot}</View> : null}
        </View>
      </View>
      {showBeam ? (
        <BorderBeam colorFrom="#60a5fa" colorTo="#a78bfa" size={80} duration={4000} />
      ) : null}
    </View>
  );
}
