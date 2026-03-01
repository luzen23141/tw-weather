import { Pressable, Text, PressableProps } from 'react-native';

export type ButtonVariant = 'filled' | 'tonal' | 'outlined' | 'text';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends PressableProps {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  textClassName?: string;
  icon?: React.ReactNode;
}

export function Button({
  label,
  variant = 'filled',
  size = 'md',
  className = '',
  textClassName = '',
  icon,
  ...props
}: ButtonProps) {
  const getContainerStyles = () => {
    let base =
      'flex-row items-center justify-center rounded-full overflow-hidden transition-all duration-300 ease-em-decelerate active:scale-95 ';

    switch (size) {
      case 'sm':
        base += 'h-9 px-4 ';
        break;
      case 'lg':
        base += 'h-12 px-8 ';
        break;
      case 'md':
      default:
        base += 'h-10 px-6 ';
        break;
    }

    switch (variant) {
      case 'filled':
        base +=
          'bg-md-primary hover:bg-md-primary/90 active:bg-md-primary/80 shadow-glass hover:shadow-md ';
        break;
      case 'tonal':
        base +=
          'bg-md-primary-container border border-glass-border hover:bg-md-primary-container/90 active:bg-md-primary-container/80 ';
        break;
      case 'outlined':
        base +=
          'border border-glass-border bg-md-surface-variant hover:bg-md-primary/10 active:bg-md-primary/5 ';
        break;
      case 'text':
        base += 'bg-transparent hover:bg-md-primary/10 active:bg-md-primary/5 ';
        break;
    }

    if (props.disabled) {
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
      style={() => (props.style as object) || {}}
      className={getContainerStyles()}
      {...props}
    >
      {() => (
        <>
          {icon && <span className="mr-2">{icon}</span>}
          <Text className={getLabelStyles()}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}
