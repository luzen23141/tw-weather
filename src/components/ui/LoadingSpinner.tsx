import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { useMDColors } from '@/hooks/useMDColors';

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  label?: string;
  className?: string;
}

const SIZE_MAP = { sm: 24, md: 32, lg: 40 } as const;

export const LoadingSpinner = React.memo(function LoadingSpinner({
  size = 'md',
  color,
  label,
  className = '',
}: LoadingSpinnerProps): React.ReactElement {
  const colors = useMDColors();
  const sizeValue = SIZE_MAP[size];

  return (
    <View className={`items-center justify-center gap-2 ${className}`.trim()}>
      <ActivityIndicator size={sizeValue} color={color ?? colors.primary} />
      {label ? <Text className="text-sm text-md-on-surface-variant">{label}</Text> : null}
    </View>
  );
});
