/**
 * SVG 天氣圖示元件
 * 根據 WMO 天氣代碼渲染對應的天氣插圖
 */
import React from 'react';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

export interface WeatherIconProps {
  /** WMO 天氣代碼 */
  weatherCode: number;
  /** 圖示尺寸（正方形） */
  size?: number;
}

/* ─── 基礎元素 ─── */

const Sun = ({ cx, cy, r }: { cx: number; cy: number; r: number }) => (
  <>
    <Circle cx={cx} cy={cy} r={r} fill="url(#sunGrad)" />
    {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
      const rad = (angle * Math.PI) / 180;
      const inner = r + 2;
      const outer = r + 5;
      return (
        <Line
          key={angle}
          x1={cx + inner * Math.cos(rad)}
          y1={cy + inner * Math.sin(rad)}
          x2={cx + outer * Math.cos(rad)}
          y2={cy + outer * Math.sin(rad)}
          stroke="#FBBF24"
          strokeWidth={1.8}
          strokeLinecap="round"
        />
      );
    })}
  </>
);

const Cloud = ({
  x,
  y,
  scale = 1,
  color = '#94A3B8',
}: {
  x: number;
  y: number;
  scale?: number;
  color?: string;
}) => (
  <Path
    d={`M${x + 6 * scale},${y + 10 * scale}
       a${5 * scale},${5 * scale} 0 0,1 ${4.5 * scale},${-8 * scale}
       a${7 * scale},${7 * scale} 0 0,1 ${12 * scale},${-1 * scale}
       a${6 * scale},${6 * scale} 0 0,1 ${5.5 * scale},${9 * scale}
       z`}
    fill={color}
  />
);

const RainDrop = ({ x, y, size = 1 }: { x: number; y: number; size?: number }) => (
  <Path
    d={`M${x},${y - 2 * size} Q${x + 1.5 * size},${y + 1 * size} ${x},${y + 2.5 * size} Q${x - 1.5 * size},${y + 1 * size} ${x},${y - 2 * size} Z`}
    fill="url(#rainGrad)"
  />
);

const SnowFlake = ({ cx, cy, r }: { cx: number; cy: number; r: number }) => (
  <>
    {[0, 60, 120].map((angle) => {
      const rad = (angle * Math.PI) / 180;
      return (
        <Line
          key={angle}
          x1={cx + r * Math.cos(rad)}
          y1={cy + r * Math.sin(rad)}
          x2={cx - r * Math.cos(rad)}
          y2={cy - r * Math.sin(rad)}
          stroke="#93C5FD"
          strokeWidth={1.2}
          strokeLinecap="round"
        />
      );
    })}
    <Circle cx={cx} cy={cy} r={0.8} fill="#93C5FD" />
  </>
);

const Lightning = ({ x, y }: { x: number; y: number }) => (
  <Path
    d={`M${x + 3},${y} L${x},${y + 5} L${x + 2.5},${y + 5} L${x - 0.5},${y + 11} L${x + 5},${y + 4} L${x + 2.5},${y + 4} Z`}
    fill="#FCD34D"
    stroke="#F59E0B"
    strokeWidth={0.4}
  />
);

/* ─── 漸層定義 ─── */

const GradientDefs = () => (
  <Defs>
    <LinearGradient id="sunGrad" x1="0" y1="0" x2="0" y2="1">
      <Stop offset="0" stopColor="#FDE68A" />
      <Stop offset="1" stopColor="#FBBF24" />
    </LinearGradient>
    <LinearGradient id="rainGrad" x1="0" y1="0" x2="0" y2="1">
      <Stop offset="0" stopColor="#60A5FA" />
      <Stop offset="1" stopColor="#3B82F6" />
    </LinearGradient>
    <LinearGradient id="darkCloudGrad" x1="0" y1="0" x2="0" y2="1">
      <Stop offset="0" stopColor="#64748B" />
      <Stop offset="1" stopColor="#475569" />
    </LinearGradient>
  </Defs>
);

/* ─── 天氣場景 ─── */

/** 晴天 */
const SunnyScene = ({ s }: { s: number }) => (
  <Svg width={s} height={s} viewBox="0 0 40 40">
    <GradientDefs />
    <Sun cx={20} cy={20} r={8} />
  </Svg>
);

/** 部分多雲 */
const PartlyCloudyScene = ({ s }: { s: number }) => (
  <Svg width={s} height={s} viewBox="0 0 40 40">
    <GradientDefs />
    <Sun cx={26} cy={13} r={6.5} />
    <Cloud x={4} y={14} scale={1} color="#CBD5E1" />
  </Svg>
);

/** 多雲 */
const CloudyScene = ({ s }: { s: number }) => (
  <Svg width={s} height={s} viewBox="0 0 40 40">
    <GradientDefs />
    <Cloud x={8} y={8} scale={0.65} color="#CBD5E1" />
    <Cloud x={4} y={14} scale={1} color="#94A3B8" />
  </Svg>
);

/** 陰天 */
const OvercastScene = ({ s }: { s: number }) => (
  <Svg width={s} height={s} viewBox="0 0 40 40">
    <GradientDefs />
    <Cloud x={8} y={6} scale={0.7} color="#94A3B8" />
    <Cloud x={2} y={14} scale={1.1} color="#64748B" />
  </Svg>
);

/** 霧 */
const FogScene = ({ s }: { s: number }) => (
  <Svg width={s} height={s} viewBox="0 0 40 40">
    <GradientDefs />
    <Cloud x={4} y={8} scale={0.85} color="#CBD5E1" />
    {[24, 28, 32].map((y) => (
      <Rect key={y} x={6} y={y} width={28} height={1.8} rx={0.9} fill="#94A3B8" opacity={0.5} />
    ))}
  </Svg>
);

/** 毛毛雨 / 小雨 */
const DrizzleScene = ({ s }: { s: number }) => (
  <Svg width={s} height={s} viewBox="0 0 40 40">
    <GradientDefs />
    <Cloud x={4} y={8} scale={1} color="#94A3B8" />
    <RainDrop x={14} y={27} size={0.8} />
    <RainDrop x={22} y={29} size={0.8} />
  </Svg>
);

/** 中雨 / 大雨 */
const RainScene = ({ s }: { s: number }) => (
  <Svg width={s} height={s} viewBox="0 0 40 40">
    <GradientDefs />
    <Cloud x={4} y={6} scale={1.05} color="#64748B" />
    <RainDrop x={12} y={26} size={1} />
    <RainDrop x={19} y={28} size={1.1} />
    <RainDrop x={26} y={25} size={0.9} />
    <RainDrop x={15} y={33} size={0.8} />
    <RainDrop x={23} y={34} size={0.8} />
  </Svg>
);

/** 雪 */
const SnowScene = ({ s }: { s: number }) => (
  <Svg width={s} height={s} viewBox="0 0 40 40">
    <GradientDefs />
    <Cloud x={4} y={6} scale={1.05} color="#94A3B8" />
    <SnowFlake cx={13} cy={27} r={2.5} />
    <SnowFlake cx={22} cy={30} r={2} />
    <SnowFlake cx={28} cy={26} r={2.2} />
  </Svg>
);

/** 雷暴 */
const ThunderstormScene = ({ s }: { s: number }) => (
  <Svg width={s} height={s} viewBox="0 0 40 40">
    <GradientDefs />
    <Cloud x={4} y={5} scale={1.05} color="#475569" />
    <Lightning x={17} y={18} />
    <RainDrop x={10} y={28} size={0.8} />
    <RainDrop x={28} y={27} size={0.8} />
  </Svg>
);

/** 未知天氣 */
const UnknownScene = ({ s }: { s: number }) => (
  <Svg width={s} height={s} viewBox="0 0 40 40">
    <GradientDefs />
    <Cloud x={4} y={12} scale={1} color="#CBD5E1" />
  </Svg>
);

/* ─── 主元件 ─── */

function getSceneByCode(weatherCode: number): React.FC<{ s: number }> {
  if (weatherCode === 0) return SunnyScene;
  if (weatherCode === 1) return PartlyCloudyScene;
  if (weatherCode === 2) return CloudyScene;
  if (weatherCode === 3) return OvercastScene;
  if (weatherCode === 45 || weatherCode === 48) return FogScene;
  if ((weatherCode >= 51 && weatherCode <= 57) || weatherCode === 61 || weatherCode === 80)
    return DrizzleScene;
  if ((weatherCode >= 63 && weatherCode <= 67) || weatherCode === 81 || weatherCode === 82)
    return RainScene;
  if ((weatherCode >= 71 && weatherCode <= 77) || weatherCode === 85 || weatherCode === 86)
    return SnowScene;
  if (weatherCode >= 95 && weatherCode <= 99) return ThunderstormScene;
  return UnknownScene;
}

export const WeatherIcon = React.memo(function WeatherIcon({
  weatherCode,
  size = 40,
}: WeatherIconProps): React.ReactElement {
  const Scene = getSceneByCode(weatherCode);
  return <Scene s={size} />;
});
