import { ActivityIndicator, Pressable, PressableProps, Text, View } from 'react-native';

import { useMDColors } from '@/hooks/useMDColors';
import { getGlassStyle } from '@/components/ui/glass';
import { getPressFeedbackStyle } from '@/components/ui/press-feedback';

export type ButtonVariant = 'filled' | 'tonal' | 'outlined' | 'text';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<PressableProps, 'accessibilityRole'> {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  textClassName?: string;
  icon?: React.ReactNode;
  loading?: boolean;
}

export function Button({
  label,
  variant = 'filled',
  size = 'md',
  className = '',
  textClassName = '',
  icon,
  loading = false,
  disabled,
  ...props
}: ButtonProps) {
  useMDColors();
  const isDisabled = disabled || loading;

  const getContainerStyles = () => {
    let base =
      'min-w-11 flex-row items-center justify-center rounded-full overflow-hidden border transition-all duration-200 ease-em-decelerate ';

    switch (size) {
      case 'sm':
        base += 'h-11 px-4 ';
        break;
      case 'lg':
        base += 'h-12 px-8 ';
        break;
      case 'md':
      default:
        base += 'h-11 px-6 ';
        break;
    }

    switch (variant) {
      case 'filled':
        base += 'border-white/24 bg-white/18 shadow-glass ';
        break;
      case 'tonal':
        base += 'border-white/22 bg-white/14 ';
        break;
      case 'outlined':
        base += 'border-white/24 bg-white/8 ';
        break;
      case 'text':
        base += 'border-transparent bg-transparent ';
        break;
    }

    if (isDisabled) {
      base += 'opacity-50 ';
    }

    return `${base} ${className}`.trim();
  };

  const getLabelStyles = () => {
    let base = 'font-medium ';

    switch (size) {
      case 'sm':
        base += 'text-xs ';
        break;
      case 'lg':
        base += 'text-base ';
        break;
      case 'md':
      default:
        base += 'text-sm ';
        break;
    }

    switch (variant) {
      case 'filled':
        base += 'text-md-on-surface ';
        break;
      case 'tonal':
        base += 'text-md-on-surface ';
        break;
      case 'outlined':
      case 'text':
        base += 'text-md-on-surface ';
        break;
    }

    return `${base} ${textClassName}`.trim();
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      accessibilityLabel={props.accessibilityLabel ?? label}
      className={getContainerStyles()}
      disabled={isDisabled}
      style={({ pressed }) => [
        getGlassStyle(18),
        getPressFeedbackStyle({ pressed }, { disabled: isDisabled, pressedOpacity: 0.84 }),
      ]}
      {...props}
    >
      <View className="flex-row items-center justify-center">
        {loading ? (
          <ActivityIndicator
            size="small"
            color="rgba(255,255,255,0.92)"
            style={{ marginRight: 8 }}
          />
        ) : null}
        {!loading && icon ? <View className="mr-2">{icon}</View> : null}
        <Text className={getLabelStyles()}>{loading ? `${label}...` : label}</Text>
      </View>
    </Pressable>
  );
}
