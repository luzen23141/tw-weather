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
        height: 22,
        width: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: selected ? 'rgba(255,255,255,0.92)' : colors.outline,
        backgroundColor: selected ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.04)',
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
            backgroundColor: '#FFFFFF',
          }}
        />
      ) : null}
    </View>
  );
}
