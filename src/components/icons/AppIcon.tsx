import React from 'react';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

export type AppIconName =
  | 'add-circle-outline'
  | 'alert-circle-outline'
  | 'calendar-outline'
  | 'checkmark-circle'
  | 'cloud-outline'
  | 'color-palette-outline'
  | 'information-circle-outline'
  | 'layers-outline'
  | 'location-outline'
  | 'navigate-outline'
  | 'options-outline'
  | 'partly-sunny-outline'
  | 'rainy-outline'
  | 'settings-outline'
  | 'thermometer-outline'
  | 'time-outline'
  | 'trash-outline'
  | 'water';

export interface AppIconProps {
  name: AppIconName;
  size?: number;
  color?: string;
}

type IconComponentProps = {
  s: number;
  color: string;
};

const baseStrokeProps = {
  fill: 'none' as const,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  strokeWidth: 1.8,
};

const PartlySunnyOutlineIcon = ({ s, color }: IconComponentProps) => (
  <Svg width={s} height={s} viewBox="0 0 24 24">
    <Circle cx={9} cy={9} r={3.5} stroke={color} {...baseStrokeProps} />
    <Line x1={9} y1={2} x2={9} y2={4} stroke={color} {...baseStrokeProps} />
    <Line x1={9} y1={14} x2={9} y2={16} stroke={color} {...baseStrokeProps} />
    <Line x1={2} y1={9} x2={4} y2={9} stroke={color} {...baseStrokeProps} />
    <Line x1={14} y1={9} x2={16} y2={9} stroke={color} {...baseStrokeProps} />
    <Line x1={4.3} y1={4.3} x2={5.8} y2={5.8} stroke={color} {...baseStrokeProps} />
    <Line x1={12.2} y1={12.2} x2={13.7} y2={13.7} stroke={color} {...baseStrokeProps} />
    <Path
      d="M9.5 18.5h7.2a3.3 3.3 0 0 0 .3-6.6 4.8 4.8 0 0 0-9.1 1.5A2.9 2.9 0 0 0 9.5 18.5Z"
      stroke={color}
      {...baseStrokeProps}
    />
  </Svg>
);

const CalendarOutlineIcon = ({ s, color }: IconComponentProps) => (
  <Svg width={s} height={s} viewBox="0 0 24 24">
    <Rect x={3.5} y={5.5} width={17} height={15} rx={3} stroke={color} {...baseStrokeProps} />
    <Line x1={7.5} y1={3} x2={7.5} y2={8} stroke={color} {...baseStrokeProps} />
    <Line x1={16.5} y1={3} x2={16.5} y2={8} stroke={color} {...baseStrokeProps} />
    <Line x1={3.5} y1={9} x2={20.5} y2={9} stroke={color} {...baseStrokeProps} />
    <Circle cx={8} cy={13} r={0.9} fill={color} />
    <Circle cx={12} cy={13} r={0.9} fill={color} />
    <Circle cx={16} cy={13} r={0.9} fill={color} />
  </Svg>
);

const TimeOutlineIcon = ({ s, color }: IconComponentProps) => (
  <Svg width={s} height={s} viewBox="0 0 24 24">
    <Circle cx={12} cy={12} r={8.5} stroke={color} {...baseStrokeProps} />
    <Line x1={12} y1={7.5} x2={12} y2={12.2} stroke={color} {...baseStrokeProps} />
    <Line x1={12} y1={12} x2={15.8} y2={14.2} stroke={color} {...baseStrokeProps} />
  </Svg>
);

const LocationOutlineIcon = ({ s, color }: IconComponentProps) => (
  <Svg width={s} height={s} viewBox="0 0 24 24">
    <Path
      d="M12 20.5s6-5.6 6-10a6 6 0 1 0-12 0c0 4.4 6 10 6 10Z"
      stroke={color}
      {...baseStrokeProps}
    />
    <Circle cx={12} cy={10.5} r={2.1} stroke={color} {...baseStrokeProps} />
  </Svg>
);

const SettingsOutlineIcon = ({ s, color }: IconComponentProps) => (
  <Svg width={s} height={s} viewBox="0 0 24 24">
    <Circle cx={12} cy={12} r={3.1} stroke={color} {...baseStrokeProps} />
    <Line x1={12} y1={2.5} x2={12} y2={5} stroke={color} {...baseStrokeProps} />
    <Line x1={12} y1={19} x2={12} y2={21.5} stroke={color} {...baseStrokeProps} />
    <Line x1={2.5} y1={12} x2={5} y2={12} stroke={color} {...baseStrokeProps} />
    <Line x1={19} y1={12} x2={21.5} y2={12} stroke={color} {...baseStrokeProps} />
    <Line x1={5.3} y1={5.3} x2={7.1} y2={7.1} stroke={color} {...baseStrokeProps} />
    <Line x1={16.9} y1={16.9} x2={18.7} y2={18.7} stroke={color} {...baseStrokeProps} />
    <Line x1={16.9} y1={7.1} x2={18.7} y2={5.3} stroke={color} {...baseStrokeProps} />
    <Line x1={5.3} y1={18.7} x2={7.1} y2={16.9} stroke={color} {...baseStrokeProps} />
  </Svg>
);

const WaterIcon = ({ s, color }: IconComponentProps) => (
  <Svg width={s} height={s} viewBox="0 0 24 24">
    <Path
      d="M12 3.2s-5.6 7.1-5.6 10.9a5.6 5.6 0 0 0 11.2 0C17.6 10.3 12 3.2 12 3.2Z"
      fill={color}
      opacity={0.9}
    />
    <Path d="M9.2 13.8c0-1.7 1.2-3.9 2.5-5.6" stroke="white" opacity={0.55} {...baseStrokeProps} />
  </Svg>
);

const NavigateOutlineIcon = ({ s, color }: IconComponentProps) => (
  <Svg width={s} height={s} viewBox="0 0 24 24">
    <Path d="M20 4 4.8 10.4l6.2 2.6L13.6 19 20 4Z" stroke={color} {...baseStrokeProps} />
    <Line x1={11} y1={13} x2={20} y2={4} stroke={color} {...baseStrokeProps} />
  </Svg>
);

const CheckmarkCircleIcon = ({ s, color }: IconComponentProps) => (
  <Svg width={s} height={s} viewBox="0 0 24 24">
    <Circle cx={12} cy={12} r={9} fill={color} opacity={0.16} />
    <Circle cx={12} cy={12} r={8.4} stroke={color} {...baseStrokeProps} />
    <Path d="m8.2 12.4 2.5 2.6 5.2-5.5" stroke={color} {...baseStrokeProps} />
  </Svg>
);

const AddCircleOutlineIcon = ({ s, color }: IconComponentProps) => (
  <Svg width={s} height={s} viewBox="0 0 24 24">
    <Circle cx={12} cy={12} r={8.5} stroke={color} {...baseStrokeProps} />
    <Line x1={12} y1={8} x2={12} y2={16} stroke={color} {...baseStrokeProps} />
    <Line x1={8} y1={12} x2={16} y2={12} stroke={color} {...baseStrokeProps} />
  </Svg>
);

const TrashOutlineIcon = ({ s, color }: IconComponentProps) => (
  <Svg width={s} height={s} viewBox="0 0 24 24">
    <Path d="M5.5 7.5h13" stroke={color} {...baseStrokeProps} />
    <Path
      d="M9 7.5V5.7A1.7 1.7 0 0 1 10.7 4h2.6A1.7 1.7 0 0 1 15 5.7v1.8"
      stroke={color}
      {...baseStrokeProps}
    />
    <Rect x={7.5} y={7.5} width={9} height={11.5} rx={2} stroke={color} {...baseStrokeProps} />
    <Line x1={10} y1={10.5} x2={10} y2={16} stroke={color} {...baseStrokeProps} />
    <Line x1={14} y1={10.5} x2={14} y2={16} stroke={color} {...baseStrokeProps} />
  </Svg>
);

const ColorPaletteOutlineIcon = ({ s, color }: IconComponentProps) => (
  <Svg width={s} height={s} viewBox="0 0 24 24">
    <Path
      d="M12 4a8 8 0 1 0 0 16h1.4a2.1 2.1 0 0 0 0-4.2h-.8a1.8 1.8 0 0 1-1.8-1.8v-.2A2.8 2.8 0 0 1 13.6 11H15A5 5 0 0 0 20 6.1 8 8 0 0 0 12 4Z"
      stroke={color}
      {...baseStrokeProps}
    />
    <Circle cx={8.2} cy={10.3} r={1} fill={color} />
    <Circle cx={10.8} cy={7.7} r={1} fill={color} />
    <Circle cx={14.4} cy={7.6} r={1} fill={color} />
    <Circle cx={16.5} cy={10.7} r={1} fill={color} />
  </Svg>
);

const CloudOutlineIcon = ({ s, color }: IconComponentProps) => (
  <Svg width={s} height={s} viewBox="0 0 24 24">
    <Path
      d="M7.5 18h9.2a3.8 3.8 0 0 0 .2-7.6 5.4 5.4 0 0 0-10.1 1.7A3.2 3.2 0 0 0 7.5 18Z"
      stroke={color}
      {...baseStrokeProps}
    />
  </Svg>
);

const LayersOutlineIcon = ({ s, color }: IconComponentProps) => (
  <Svg width={s} height={s} viewBox="0 0 24 24">
    <Path d="m12 4 8 4.5-8 4.5-8-4.5L12 4Z" stroke={color} {...baseStrokeProps} />
    <Path d="m4.8 12 7.2 4 7.2-4" stroke={color} {...baseStrokeProps} />
    <Path d="m4.8 15.5 7.2 4 7.2-4" stroke={color} {...baseStrokeProps} />
  </Svg>
);

const OptionsOutlineIcon = ({ s, color }: IconComponentProps) => (
  <Svg width={s} height={s} viewBox="0 0 24 24">
    <Line x1={4} y1={7} x2={20} y2={7} stroke={color} {...baseStrokeProps} />
    <Circle cx={9} cy={7} r={2} fill="white" stroke={color} strokeWidth={1.8} />
    <Line x1={4} y1={12} x2={20} y2={12} stroke={color} {...baseStrokeProps} />
    <Circle cx={15} cy={12} r={2} fill="white" stroke={color} strokeWidth={1.8} />
    <Line x1={4} y1={17} x2={20} y2={17} stroke={color} {...baseStrokeProps} />
    <Circle cx={11} cy={17} r={2} fill="white" stroke={color} strokeWidth={1.8} />
  </Svg>
);

const ThermometerOutlineIcon = ({ s, color }: IconComponentProps) => (
  <Svg width={s} height={s} viewBox="0 0 24 24">
    <Path
      d="M12 4a2.5 2.5 0 0 0-2.5 2.5v7.3a4 4 0 1 0 5 0V6.5A2.5 2.5 0 0 0 12 4Z"
      stroke={color}
      {...baseStrokeProps}
    />
    <Circle cx={12} cy={17.5} r={2.1} fill={color} opacity={0.2} />
    <Path d="M12 9v7" stroke={color} {...baseStrokeProps} />
  </Svg>
);

const RainyOutlineIcon = ({ s, color }: IconComponentProps) => (
  <Svg width={s} height={s} viewBox="0 0 24 24">
    <Path
      d="M7.5 14.5h9.2a3.8 3.8 0 0 0 .2-7.6 5.4 5.4 0 0 0-10.1 1.7 3.2 3.2 0 0 0 .7 5.9Z"
      stroke={color}
      {...baseStrokeProps}
    />
    <Line x1={9} y1={16.5} x2={8.1} y2={19} stroke={color} {...baseStrokeProps} />
    <Line x1={13} y1={16.5} x2={12.1} y2={20} stroke={color} {...baseStrokeProps} />
    <Line x1={17} y1={16.5} x2={16.1} y2={19} stroke={color} {...baseStrokeProps} />
  </Svg>
);

const AlertCircleOutlineIcon = ({ s, color }: IconComponentProps) => (
  <Svg width={s} height={s} viewBox="0 0 24 24">
    <Circle cx={12} cy={12} r={8.5} stroke={color} {...baseStrokeProps} />
    <Line x1={12} y1={7.3} x2={12} y2={12.6} stroke={color} {...baseStrokeProps} />
    <Circle cx={12} cy={16.5} r={1} fill={color} />
  </Svg>
);

const InformationCircleOutlineIcon = ({ s, color }: IconComponentProps) => (
  <Svg width={s} height={s} viewBox="0 0 24 24">
    <Circle cx={12} cy={12} r={8.5} stroke={color} {...baseStrokeProps} />
    <Circle cx={12} cy={8} r={1} fill={color} />
    <Line x1={12} y1={11} x2={12} y2={16.2} stroke={color} {...baseStrokeProps} />
  </Svg>
);

const iconComponents: Record<AppIconName, React.FC<IconComponentProps>> = {
  'add-circle-outline': AddCircleOutlineIcon,
  'alert-circle-outline': AlertCircleOutlineIcon,
  'calendar-outline': CalendarOutlineIcon,
  'checkmark-circle': CheckmarkCircleIcon,
  'cloud-outline': CloudOutlineIcon,
  'color-palette-outline': ColorPaletteOutlineIcon,
  'information-circle-outline': InformationCircleOutlineIcon,
  'layers-outline': LayersOutlineIcon,
  'location-outline': LocationOutlineIcon,
  'navigate-outline': NavigateOutlineIcon,
  'options-outline': OptionsOutlineIcon,
  'partly-sunny-outline': PartlySunnyOutlineIcon,
  'rainy-outline': RainyOutlineIcon,
  'settings-outline': SettingsOutlineIcon,
  'thermometer-outline': ThermometerOutlineIcon,
  'time-outline': TimeOutlineIcon,
  'trash-outline': TrashOutlineIcon,
  water: WaterIcon,
};

export const AppIcon = React.memo(function AppIcon({
  name,
  size = 20,
  color = '#64748B',
}: AppIconProps): React.ReactElement {
  const Icon = iconComponents[name];
  return <Icon s={size} color={color} />;
});
