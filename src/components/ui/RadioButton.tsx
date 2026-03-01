import React from 'react';
import { View } from 'react-native';

import { useMDColors } from '@/hooks/useMDColors';

interface RadioButtonProps {
  selected: boolean;
}

export function RadioButton({ selected }: RadioButtonProps) {
  const colors = useMDColors();

  return (
    <View
      style={{
        height: 20,
        width: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: selected ? colors.primary : colors.outline,
        alignItems: 'center',
        justifyContent: 'center',
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
