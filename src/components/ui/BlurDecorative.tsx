import { View, ViewProps, Platform } from 'react-native';

export interface BlurDecorativeProps extends ViewProps {
  color?: 'primary' | 'secondary' | 'tertiary' | 'accent';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  className?: string;
  opacity?: number;
}

export function BlurDecorative({
  color = 'primary',
  size = 'lg',
  position = 'top-right',
  className = '',
  opacity = 0.15,
  ...props
}: BlurDecorativeProps) {
  let baseStyles = 'absolute rounded-full mix-blend-multiply ';

  if (Platform.OS === 'web') {
    baseStyles += 'blur-[80px] ';
  } else {
    baseStyles += 'opacity-40 ';
  }

  switch (color) {
    case 'primary':
      baseStyles += 'bg-md-primary ';
      break;
    case 'secondary':
      baseStyles += 'bg-md-secondary ';
      break;
    case 'tertiary':
      baseStyles += 'bg-md-tertiary ';
      break;
    case 'accent':
      baseStyles += 'bg-[#06b6d4] ';
      break;
  }

  switch (size) {
    case 'sm':
      baseStyles += 'w-32 h-32 ';
      break;
    case 'md':
      baseStyles += 'w-48 h-48 ';
      break;
    case 'lg':
      baseStyles += 'w-64 h-64 ';
      break;
    case 'xl':
      baseStyles += 'w-96 h-96 ';
      break;
  }

  switch (position) {
    case 'top-left':
      baseStyles += '-top-10 -left-10 ';
      break;
    case 'top-right':
      baseStyles += '-top-10 -right-10 ';
      break;
    case 'bottom-left':
      baseStyles += '-bottom-10 -left-10 ';
      break;
    case 'bottom-right':
      baseStyles += '-bottom-10 -right-10 ';
      break;
    case 'center':
      baseStyles += 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ';
      break;
  }

  return (
    <View
      className={`${baseStyles} ${className}`.trim()}
      style={{
        opacity: Platform.OS === 'web' ? opacity : opacity * 2,
        zIndex: -1,
        ...((props.style as object) || {}),
      }}
      pointerEvents="none"
      {...props}
    />
  );
}
