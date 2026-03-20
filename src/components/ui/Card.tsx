import { View, ViewProps } from 'react-native';

import { getGlassStyle } from '@/components/ui/glass';

export interface CardProps extends ViewProps {
  className?: string;
}

export function Card({ children, className = '', style, ...props }: CardProps) {
  const baseStyles =
    'overflow-hidden rounded-[30px] border border-white/20 p-6 transition-all duration-300 ease-em-decelerate ';
  const filledStyles = 'bg-white/14 shadow-glass hover:bg-white/16 hover:shadow-md ';

  return (
    <View
      className={`${baseStyles} ${filledStyles} ${className}`.trim()}
      style={[getGlassStyle(20), style]}
      {...props}
    >
      <View className="absolute inset-x-0 top-0 h-px bg-white/30" />
      {children}
    </View>
  );
}
