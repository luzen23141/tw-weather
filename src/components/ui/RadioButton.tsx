import React from 'react';
import { View } from 'react-native';

import { useMDColors } from '@/hooks/useMDColors';

interface RadioButtonProps {
  selected: boolean;
  disabled?: boolean;
}

export function RadioButton({ selected, disabled = false }: RadioButtonProps) {
  const colors = useMDColors();

  return (
    <View
      style={{
        pointerEvents: 'none',
        height: 20,
        width: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: selected ? colors.primary : colors.outline,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.55 : 1,
      }}
    >
      {selected ? (
        <View
          style={{
            height: 10,
            width: 10,
            borderRadius: 5,
            backgroundColor: colors.primary,
          }}
        />
      ) : null}
    </View>
  );
}
