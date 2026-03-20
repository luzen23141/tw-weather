import type { ReactNode } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';

import { AppIcon, type AppIconName } from '@/components/icons/AppIcon';
import { getPressFeedbackStyle } from '@/components/ui/press-feedback';
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
        checked?: boolean | 'mixed';
        selected?: boolean;
        disabled?: boolean;
      }
    | undefined;
};

type RadioSettingOptionProps = {
  title: string;
  description?: string | undefined;
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
          <View className="mt-0.5 h-9 w-9 items-center justify-center rounded-xl border border-white/18 bg-white/10">
            <AppIcon name={leadingIcon} size={18} color="var(--color-md-primary)" />
          </View>
        ) : null}
        <View className={`flex-1 ${hasSupportingText ? 'gap-1' : ''}`}>
          <Text
            className={`text-[15px] font-semibold leading-5 tracking-tight text-md-on-surface ${disabled ? 'opacity-50' : ''}`}
          >
            {title}
          </Text>
          {description ? (
            <Text
              className={`text-[13px] font-medium leading-[18px] text-md-on-surface-variant/86 ${
                disabled ? 'opacity-50' : ''
              }`}
            >
              {description}
            </Text>
          ) : null}
          {hint ? (
            <Text
              className={`text-[11px] font-medium leading-4 text-md-on-surface-variant/78 ${disabled ? 'opacity-50' : ''}`}
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

  const resolvedAccessibilityState = {
    ...accessibilityState,
    disabled,
    ...(accessibilityRole === 'radio'
      ? { checked: selected, selected }
      : accessibilityRole === 'switch'
        ? { checked: accessibilityState?.checked ?? selected }
        : { selected }),
  };

  if (onPress) {
    return (
      <Pressable
        accessibilityRole={accessibilityRole}
        accessibilityLabel={title}
        accessibilityHint={[description, hint].filter(Boolean).join(' ')}
        accessibilityState={resolvedAccessibilityState}
        {...(Platform.OS === 'web'
          ? {
              'aria-checked':
                accessibilityRole === 'radio' || accessibilityRole === 'switch'
                  ? Boolean(resolvedAccessibilityState.checked)
                  : undefined,
              'data-state':
                accessibilityRole === 'radio'
                  ? selected
                    ? 'checked'
                    : 'unchecked'
                  : accessibilityRole === 'switch'
                    ? resolvedAccessibilityState.checked
                      ? 'checked'
                      : 'unchecked'
                    : undefined,
            }
          : {})}
        disabled={disabled}
        onPress={onPress}
        className={`flex-row items-center justify-between px-5 ${
          hasSupportingText
            ? 'min-h-[68px] py-4'
            : isCompact
              ? 'min-h-[52px] py-3'
              : 'min-h-[56px] py-3.5'
        } ${!isLast ? 'border-b border-white/12' : ''}`}
        style={({ pressed }) => [
          {
            backgroundColor: pressed
              ? 'rgba(255,255,255,0.08)'
              : selected
                ? 'rgba(255,255,255,0.12)'
                : 'transparent',
          },
          getPressFeedbackStyle(
            { pressed },
            { disabled, pressedOpacity: 0.9, pressedScale: 0.992 },
          ),
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
      } ${!isLast ? 'border-b border-white/12' : ''}`}
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
      accessibilityState={{ checked: selected, selected }}
      trailing={<RadioButton selected={selected} />}
    />
  );
}
