import type { CSSProperties, ReactNode } from 'react';

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

function getRowClassName({
  hasSupportingText,
  isCompact,
  isLast,
}: {
  hasSupportingText: boolean;
  isCompact: boolean;
  isLast: boolean;
}): string {
  return `flex-row items-center justify-between px-5 ${
    hasSupportingText
      ? 'min-h-[68px] py-4'
      : isCompact
        ? 'min-h-[52px] py-3'
        : 'min-h-[56px] py-3.5'
  } ${!isLast ? 'border-b border-white/12' : ''}`;
}

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
  const rowClassName = getRowClassName({ hasSupportingText, isCompact, isLast });
  const resolvedChecked =
    accessibilityRole === 'radio'
      ? selected
      : accessibilityRole === 'switch'
        ? Boolean(accessibilityState?.checked ?? selected)
        : undefined;

  const webButtonStyle: CSSProperties = {
    appearance: 'none',
    WebkitAppearance: 'none',
    width: '100%',
    border: 'none',
    background: selected ? 'rgba(255,255,255,0.12)' : 'transparent',
    padding: 0,
    margin: 0,
    textAlign: 'left',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
  };

  const content = (
    <>
      <div className="flex-1 flex flex-row items-start gap-3 pr-4">
        {leadingIcon ? (
          <div className="mt-0.5 h-9 w-9 flex items-center justify-center rounded-xl border border-white/18 bg-white/10">
            <AppIcon name={leadingIcon} size={18} color="var(--color-md-primary)" />
          </div>
        ) : null}
        <div className={`flex-1 ${hasSupportingText ? 'gap-1' : ''}`}>
          <span
            className={`block text-[15px] font-semibold leading-5 tracking-tight text-md-on-surface ${disabled ? 'opacity-50' : ''}`}
          >
            {title}
          </span>
          {description ? (
            <span
              className={`block text-[13px] font-medium leading-[18px] text-md-on-surface-variant/86 ${
                disabled ? 'opacity-50' : ''
              }`}
            >
              {description}
            </span>
          ) : null}
          {hint ? (
            <span
              className={`block text-[11px] font-medium leading-4 text-md-on-surface-variant/78 ${
                disabled ? 'opacity-50' : ''
              }`}
            >
              {hint}
            </span>
          ) : null}
        </div>
      </div>
      {trailing ? (
        <div className={`min-w-[28px] items-end justify-center ${disabled ? 'opacity-50' : ''}`}>
          {trailing}
        </div>
      ) : null}
    </>
  );

  if (!onPress) {
    return <div className={rowClassName}>{content}</div>;
  }

  return (
    <button
      type="button"
      role={accessibilityRole}
      aria-label={title}
      aria-describedby={description || hint ? `${title}-hint` : undefined}
      aria-checked={typeof resolvedChecked === 'boolean' ? resolvedChecked : undefined}
      aria-disabled={disabled}
      data-state={
        typeof resolvedChecked === 'boolean'
          ? resolvedChecked
            ? 'checked'
            : 'unchecked'
          : undefined
      }
      disabled={disabled}
      onClick={onPress}
      style={webButtonStyle}
    >
      <div className={rowClassName}>{content}</div>
    </button>
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
