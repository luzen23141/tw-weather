import React, { useEffect } from 'react';
import { Platform, Text, TextProps } from 'react-native';
import Animated, {
  useSharedValue,
  useDerivedValue,
  withDelay,
  withSpring,
  useAnimatedProps,
} from 'react-native-reanimated';

export interface NumberTickerProps extends Omit<TextProps, 'children'> {
  /** 目標數值 */
  value: number;
  /** 起始值，預設 0 */
  startValue?: number;
  /** 計數方向：up 從小到大，down 從大到小 */
  direction?: 'up' | 'down';
  /** 延遲毫秒數 */
  delay?: number;
  /** 小數位數 */
  decimalPlaces?: number;
  /** 數字後綴（如 °、%） */
  suffix?: string;
  className?: string;
}

// eslint-disable-next-line @typescript-eslint/no-require-imports
const RNText = require('react-native').Text as React.ComponentType<
  TextProps & { text?: string; defaultValue?: string }
>;
const AnimatedText = Animated.createAnimatedComponent(RNText);

function NativeNumberTicker({
  value,
  startValue = 0,
  direction = 'up',
  delay: delayMs = 0,
  decimalPlaces = 0,
  suffix = '',
  className = '',
  ...props
}: NumberTickerProps) {
  const initial = direction === 'down' ? value : startValue;
  const animatedValue = useSharedValue(initial);

  useEffect(() => {
    const target = direction === 'down' ? startValue : value;
    animatedValue.value = withDelay(delayMs, withSpring(target, { damping: 60, stiffness: 100 }));
  }, [value, startValue, direction, delayMs, animatedValue]);

  const displayText = useDerivedValue(() => {
    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    }).format(animatedValue.value);
    return `${formatted}${suffix}`;
  });

  const animatedProps = useAnimatedProps(() => ({
    text: displayText.value,
    // defaultValue 確保 SSR / 初始渲染有值
    defaultValue: displayText.value,
  }));

  return (
    <AnimatedText
      className={`tabular-nums ${className}`.trim()}
      animatedProps={animatedProps}
      {...props}
    />
  );
}

/**
 * NumberTicker — 數字跳動動畫。
 * Native：用彈簧動畫從 startValue 滾動到 value。
 * Web：直接顯示靜態文字（animatedProps 的 text 屬性在 Web DOM 不生效）。
 */
export function NumberTicker(props: NumberTickerProps) {
  const { value, decimalPlaces = 0, suffix = '', className = '', ...rest } = props;

  if (Platform.OS === 'web') {
    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    }).format(value);
    return (
      <Text className={`tabular-nums ${className}`.trim()} {...rest}>
        {`${formatted}${suffix}`}
      </Text>
    );
  }

  return <NativeNumberTicker {...props} />;
}
