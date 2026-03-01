import React from 'react';
import { ActivityIndicator, View, Text } from 'react-native';

import { useMDColors } from '@/hooks/useMDColors';

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  label?: string;
}

const SIZE_MAP = { sm: 30, md: 40, lg: 50 } as const;

export const LoadingSpinner = React.memo(function LoadingSpinner({
  size = 'md',
  color,
  label,
}: LoadingSpinnerProps): React.ReactElement {
  const colors = useMDColors();
  const sizeValue = SIZE_MAP[size];

  return (
    <View className="flex items-center justify-center gap-2">
      <ActivityIndicator size={sizeValue} color={color ?? colors.primary} />
      {label && <Text className="text-base text-md-on-surface-variant">{label}</Text>}
    </View>
  );
});
