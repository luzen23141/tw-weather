import { memo, useMemo } from 'react';
import { Platform, StyleProp, View, ViewStyle, useWindowDimensions } from 'react-native';
import { Svg, Circle, Defs, Pattern, Rect } from 'react-native-svg';

export interface DotPatternProps {
  dotSize?: number;
  gap?: number;
  color?: string;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

const DotPatternComponent = ({
  dotSize = 1.2,
  gap = 20,
  color = 'rgba(255,255,255,0.15)',
  className,
  style,
}: DotPatternProps) => {
  const { width, height } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';

  const nativeDots = useMemo(() => {
    const rows = Math.ceil(height / gap) + 1;
    const columns = Math.ceil(width / gap) + 1;
    const dots: { cx: number; cy: number }[] = [];
    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        dots.push({
          cx: column * gap,
          cy: row * gap,
        });
      }
    }
    return dots;
  }, [height, gap, width]);

  const patternId = useMemo(() => `dot-pattern-${Math.random().toString(36).slice(2, 8)}`, []);

  if (isWeb) {
    return (
      <View
        {...(className ? { className } : {})}
        style={[
          {
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
          },
          style,
        ]}
      >
        <Svg width="100%" height="100%">
          <Defs>
            <Pattern
              id={patternId}
              x="0"
              y="0"
              width={gap}
              height={gap}
              patternUnits="userSpaceOnUse"
            >
              <Circle cx={dotSize} cy={dotSize} r={dotSize} fill={color} />
            </Pattern>
          </Defs>
          <Rect width="100%" height="100%" fill={`url(#${patternId})`} />
        </Svg>
      </View>
    );
  }

  return (
    <View
      {...(className ? { className } : {})}
      style={[
        {
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
        },
        style,
      ]}
    >
      <Svg width="100%" height="100%">
        {nativeDots.map((dot, index) => (
          <Circle
            key={`${dot.cx}-${dot.cy}-${index}`}
            cx={dot.cx}
            cy={dot.cy}
            r={dotSize}
            fill={color}
          />
        ))}
      </Svg>
    </View>
  );
};

export const DotPattern = memo(DotPatternComponent);
