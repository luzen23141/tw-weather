import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

import { AppIcon, type AppIconName } from '@/components/icons/AppIcon';
import { RadioButton } from '@/components/ui/RadioButton';

export type SettingRowProps = {
  title: string;
  description?: string | undefined;
  hint?: string | undefined;
  leadingIcon?: AppIconName | undefined;
  trailing?: ReactNode;
  onPress?: (() => void) | undefined;
  isLast?: boolean | undefined;
  selected?: boolean | undefined;
  disabled?: boolean | undefined;
  compact?: boolean | undefined;
  accessibilityRole?: 'button' | 'radio' | 'switch' | undefined;
  accessibilityState?:
    | {
        checked?: boolean;
        selected?: boolean;
        disabled?: boolean;
      }
    | undefined;
};

type RadioSettingOptionProps = {
  title: string;
  description: string;
  hint?: string | undefined;
  value: string;
  selectedValue: string;
  onPress: () => void;
  isLast?: boolean | undefined;
  compact?: boolean | undefined;
};

export function SettingsRow({
  title,
  description,
  hint,
  leadingIcon,
  trailing,
  onPress,
  isLast = false,
  selected = false,
  disabled = false,
  compact = false,
  accessibilityRole,
  accessibilityState,
}: SettingRowProps) {
  const hasSupportingText = Boolean(description) || Boolean(hint);
  const isCompact = compact && !hasSupportingText;
  const content = (
    <>
      <View className="flex-1 flex-row items-start gap-3 pr-4">
        {leadingIcon ? (
          <View className="mt-0.5 h-9 w-9 items-center justify-center rounded-xl bg-md-primary/10">
            <AppIcon name={leadingIcon} size={18} color="var(--color-md-primary)" />
          </View>
        ) : null}
        <View className={`flex-1 ${hasSupportingText ? 'gap-1' : ''}`}>
          <Text
            className={`text-[15px] font-semibold leading-5 ${
              selected ? 'text-md-on-surface' : 'text-md-on-surface'
            } ${disabled ? 'opacity-50' : ''}`}
          >
            {title}
          </Text>
          {description ? (
            <Text
              className={`text-[13px] leading-[18px] text-md-on-surface-variant ${
                disabled ? 'opacity-50' : ''
              }`}
            >
              {description}
            </Text>
          ) : null}
          {hint ? (
            <Text
              className={`text-[12px] leading-4 text-md-on-surface-variant ${disabled ? 'opacity-50' : ''}`}
            >
              {hint}
            </Text>
          ) : null}
        </View>
      </View>
      {trailing ? (
        <View className={`min-w-[28px] items-end justify-center ${disabled ? 'opacity-50' : ''}`}>
          {trailing}
        </View>
      ) : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityRole={accessibilityRole}
        accessibilityLabel={title}
        accessibilityHint={[description, hint].filter(Boolean).join(' ')}
        accessibilityState={{ ...accessibilityState, disabled, selected }}
        disabled={disabled}
        onPress={onPress}
        className={`flex-row items-center justify-between px-5 ${
          hasSupportingText
            ? 'min-h-[68px] py-4'
            : isCompact
              ? 'min-h-[52px] py-3'
              : 'min-h-[56px] py-3.5'
        } ${selected ? 'bg-md-primary/12' : ''} ${!isLast ? 'border-b border-glass-border' : ''}`}
        style={({ pressed }) => [
          {
            backgroundColor: pressed
              ? 'var(--color-md-surface-variant)'
              : selected
                ? 'color-mix(in srgb, var(--color-md-primary) 12%, var(--color-md-surface))'
                : 'transparent',
            opacity: disabled ? 0.55 : pressed ? 0.96 : 1,
          },
        ]}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View
      className={`flex-row items-center justify-between px-5 ${
        hasSupportingText
          ? 'min-h-[68px] py-4'
          : isCompact
            ? 'min-h-[52px] py-3'
            : 'min-h-[56px] py-3.5'
      } ${!isLast ? 'border-b border-glass-border' : ''}`}
    >
      {content}
    </View>
  );
}

export function RadioSettingOption({
  title,
  description,
  hint,
  value,
  selectedValue,
  onPress,
  isLast = false,
  compact = false,
}: RadioSettingOptionProps) {
  const selected = value === selectedValue;

  return (
    <SettingsRow
      title={title}
      description={description}
      {...(hint !== undefined ? { hint } : {})}
      selected={selected}
      compact={compact}
      onPress={onPress}
      isLast={isLast}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      trailing={<RadioButton selected={selected} />}
    />
  );
}
