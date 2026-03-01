import { useState } from 'react';
import { TextInput, TextInputProps, View, Text } from 'react-native';

import { useMDColors } from '@/hooks/useMDColors';
import { getGlassStyle } from '@/utils/glass';

export interface TextFieldProps extends TextInputProps {
  label?: string;
  error?: string;
  className?: string;
  inputClassName?: string;
}

export function TextField({
  label,
  error,
  className = '',
  inputClassName = '',
  ...props
}: TextFieldProps) {
  const colors = useMDColors();
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View className={`w-full ${className}`}>
      {label && (
        <Text
          className={`mb-1 text-xs font-medium ${isFocused ? 'text-md-primary' : 'text-md-on-surface-variant'}`}
        >
          {label}
        </Text>
      )}
      <View
        className={`h-14 px-4 bg-md-surface-container rounded-2xl border transition-colors duration-200
        ${isFocused ? 'border-md-primary' : 'border-glass-border'}`}
        style={getGlassStyle(20)}
      >
        <TextInput
          className={`flex-1 text-base text-md-on-surface outline-none ${inputClassName}`}
          placeholderTextColor={colors.outline}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          {...props}
        />
      </View>
      {error && <Text className="mt-1 text-xs text-md-error pl-4">{error}</Text>}
    </View>
  );
}
