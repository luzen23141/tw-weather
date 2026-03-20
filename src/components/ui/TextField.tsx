import { useState } from 'react';
import { Text, TextInput, TextInputProps, View } from 'react-native';

import { useMDColors } from '@/hooks/useMDColors';
import { getGlassStyle } from '@/components/ui/glass';

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
  editable,
  ...props
}: TextFieldProps) {
  const colors = useMDColors();
  const [isFocused, setIsFocused] = useState(false);
  const isDisabled = editable === false;

  return (
    <View className={`w-full ${className}`.trim()}>
      {label ? (
        <Text
          className={`mb-1 text-xs font-medium ${isFocused ? 'text-md-primary' : 'text-md-on-surface-variant'}`}
        >
          {label}
        </Text>
      ) : null}
      <View
        className={`h-14 rounded-[24px] border px-4 transition-colors duration-200 ${
          isFocused ? 'border-white/34 bg-white/18' : 'border-white/20 bg-white/12'
        } ${isDisabled ? 'opacity-60' : ''}`}
        style={getGlassStyle(20)}
      >
        <TextInput
          accessibilityState={{ disabled: isDisabled }}
          className={`flex-1 text-base text-md-on-surface outline-none ${inputClassName}`.trim()}
          editable={editable}
          placeholderTextColor={colors.onSurfaceVariant}
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
      {error ? <Text className="mt-1 pl-4 text-xs text-md-error">{error}</Text> : null}
    </View>
  );
}
