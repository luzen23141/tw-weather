/**
 * SVG 統計指標圖示
 * 溫度計、濕度、風速、降水量
 */
import React from 'react';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';

export type StatIconType = 'thermometer' | 'humidity' | 'wind' | 'precipitation';

export interface StatIconProps {
  type: StatIconType;
  size?: number;
  color?: string;
}

/** 溫度計 */
const ThermometerIcon = ({ s, color }: { s: number; color: string }) => (
  <Svg width={s} height={s} viewBox="0 0 24 24">
    <Defs>
      <LinearGradient id="thermoGrad" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#F87171" />
        <Stop offset="1" stopColor="#EF4444" />
      </LinearGradient>
    </Defs>
    {/* 管身 */}
    <Path
      d="M12 2C10.34 2 9 3.34 9 5v8.26A4.5 4.5 0 1016.5 17 4.49 4.49 0 0015 13.26V5c0-1.66-1.34-3-3-3z"
      fill="none"
      stroke={color}
      strokeWidth={1.5}
    />
    {/* 水銀 */}
    <Circle cx={12} cy={17} r={2.5} fill="url(#thermoGrad)" />
    <Path d="M11 9h2v6h-2z" fill="url(#thermoGrad)" />
    {/* 刻度 */}
    <Line x1={15.5} y1={6} x2={17} y2={6} stroke={color} strokeWidth={1} strokeLinecap="round" />
    <Line x1={15.5} y1={9} x2={17} y2={9} stroke={color} strokeWidth={1} strokeLinecap="round" />
    <Line x1={15.5} y1={12} x2={17} y2={12} stroke={color} strokeWidth={1} strokeLinecap="round" />
  </Svg>
);

/** 濕度（水滴） */
const HumidityIcon = ({ s, color }: { s: number; color: string }) => (
  <Svg width={s} height={s} viewBox="0 0 24 24">
    <Defs>
      <LinearGradient id="humidGrad" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#60A5FA" />
        <Stop offset="1" stopColor="#3B82F6" />
      </LinearGradient>
    </Defs>
    <Path
      d="M12 2.5C12 2.5 5 11 5 15.5a7 7 0 0014 0C19 11 12 2.5 12 2.5z"
      fill="url(#humidGrad)"
      stroke={color}
      strokeWidth={1}
      opacity={0.9}
    />
    {/* 高光 */}
    <Path
      d="M9.5 14c0-2 1.5-4.5 2.5-6 .3.5.7 1.2 1 1.8"
      fill="none"
      stroke="white"
      strokeWidth={1.2}
      strokeLinecap="round"
      opacity={0.4}
    />
  </Svg>
);

/** 風速 */
const WindIcon = ({ s, color }: { s: number; color: string }) => (
  <Svg width={s} height={s} viewBox="0 0 24 24">
    <Path
      d="M3 8h10a3 3 0 10-3-3"
      fill="none"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M3 12h14a3 3 0 11-3 3"
      fill="none"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M3 16h7a2.5 2.5 0 11-2.5 2.5"
      fill="none"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

/** 降水量 */
const PrecipitationIcon = ({ s, color }: { s: number; color: string }) => (
  <Svg width={s} height={s} viewBox="0 0 24 24">
    <Defs>
      <LinearGradient id="precipGrad" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#60A5FA" />
        <Stop offset="1" stopColor="#2563EB" />
      </LinearGradient>
    </Defs>
    {/* 雲 */}
    <Path
      d="M6 13h12a4 4 0 00-1-7.9 5.5 5.5 0 00-10 1.4A3.5 3.5 0 006 13z"
      fill="none"
      stroke={color}
      strokeWidth={1.5}
      strokeLinejoin="round"
    />
    {/* 雨滴 */}
    <Line
      x1={8}
      y1={16}
      x2={7}
      y2={19}
      stroke="url(#precipGrad)"
      strokeWidth={1.5}
      strokeLinecap="round"
    />
    <Line
      x1={12}
      y1={16}
      x2={11}
      y2={20}
      stroke="url(#precipGrad)"
      strokeWidth={1.5}
      strokeLinecap="round"
    />
    <Line
      x1={16}
      y1={16}
      x2={15}
      y2={19}
      stroke="url(#precipGrad)"
      strokeWidth={1.5}
      strokeLinecap="round"
    />
  </Svg>
);

const iconComponents: Record<StatIconType, React.FC<{ s: number; color: string }>> = {
  thermometer: ThermometerIcon,
  humidity: HumidityIcon,
  wind: WindIcon,
  precipitation: PrecipitationIcon,
};

export const StatIcon = React.memo(function StatIcon({
  type,
  size = 20,
  color = '#64748B',
}: StatIconProps): React.ReactElement {
  const Icon = iconComponents[type];
  return <Icon s={size} color={color} />;
});
