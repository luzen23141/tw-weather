import { View, ViewProps } from 'react-native';

import { BorderBeam } from '@/components/ui/BorderBeam';
import { getGlassStyle } from '@/components/ui/glass';

export type CardVariant = 'elevated' | 'filled' | 'outlined';

export interface CardProps extends ViewProps {
  variant?: CardVariant;
  className?: string;
  isInteractive?: boolean;
  /** 是否顯示邊框光束效果 */
  showBeam?: boolean;
}

export function Card({
  children,
  variant = 'filled',
  isInteractive = false,
  showBeam = false,
  className = '',
  style,
  ...props
}: CardProps) {
  let baseStyles =
    'rounded-3xl p-6 transition-all duration-300 ease-em-decelerate border border-glass-border ';

  if (isInteractive) {
    baseStyles += 'hover:scale-[1.02] ';
  }

  switch (variant) {
    case 'elevated':
      baseStyles += 'bg-md-surface-container-low shadow-glass hover:shadow-md ';
      break;
    case 'filled':
      baseStyles += 'bg-md-surface-container hover:bg-md-surface-variant/20 hover:shadow-md ';
      break;
    case 'outlined':
      baseStyles +=
        'bg-md-surface border-glass-border-strong hover:bg-md-surface-variant/20 hover:shadow-md ';
      break;
  }

  return (
    <View
      className={`${baseStyles} ${className}`.trim()}
      style={[getGlassStyle(20), style]}
      {...props}
    >
      {children}
      {showBeam ? <BorderBeam colorFrom="#ffaa40" colorTo="#9c40ff" size={80} /> : null}
    </View>
  );
}
