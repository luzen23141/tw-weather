import { ActivityIndicator, Pressable, PressableProps, Text, View } from 'react-native';

import { useMDColors } from '@/hooks/useMDColors';

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
  const colors = useMDColors();
  const isDisabled = disabled || loading;

  const getContainerStyles = () => {
    let base =
      'min-w-11 flex-row items-center justify-center rounded-full overflow-hidden transition-all duration-200 ease-em-decelerate active:scale-95 ';

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
        base += 'bg-md-primary shadow-glass ';
        break;
      case 'tonal':
        base += 'bg-md-primary-container border border-glass-border ';
        break;
      case 'outlined':
        base += 'border border-glass-border bg-md-surface-variant ';
        break;
      case 'text':
        base += 'bg-transparent ';
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
        base += 'text-md-on-primary ';
        break;
      case 'tonal':
        base += 'text-md-on-primary-container ';
        break;
      case 'outlined':
      case 'text':
        base += 'text-md-primary ';
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
      {...props}
    >
      <View className="flex-row items-center justify-center">
        {loading ? <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: 8 }} /> : null}
        {!loading && icon ? <View className="mr-2">{icon}</View> : null}
        <Text className={getLabelStyles()}>{loading ? `${label}...` : label}</Text>
      </View>
    </Pressable>
  );
}
