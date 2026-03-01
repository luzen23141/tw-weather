import { View, ViewProps } from 'react-native';

import { getGlassStyle } from '@/utils/glass';

export type GlassIntensity = 'subtle' | 'medium' | 'strong';

export interface GlassViewProps extends ViewProps {
  intensity?: GlassIntensity;
  bordered?: boolean;
  className?: string;
}

const BLUR_MAP: Record<GlassIntensity, number> = {
  subtle: 12,
  medium: 20,
  strong: 30,
};

export function GlassView({
  intensity = 'medium',
  bordered = true,
  className = '',
  style,
  ...props
}: GlassViewProps) {
  const borderClass = bordered ? 'border border-glass-border' : '';

  return (
    <View
      className={`bg-md-surface ${borderClass} ${className}`.trim()}
      style={[getGlassStyle(BLUR_MAP[intensity]), style]}
      {...props}
    />
  );
}
