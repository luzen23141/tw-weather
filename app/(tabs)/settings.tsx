import { Ionicons } from '@expo/vector-icons';
import { ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { LocationDisplayFormat, WeatherSource } from '@/api/types';
import { BlurDecorative } from '@/components/ui/BlurDecorative';
import { GlassBackground } from '@/components/ui/GlassBackground';
import { RadioButton } from '@/components/ui/RadioButton';
import { useSettingsStore } from '@/store/settings.store';
import { getGlassStyle } from '@/utils/glass';

const glassCardClassName =
  'mx-4 rounded-3xl overflow-hidden border border-glass-border shadow-glass';
const glassCardStyle = getGlassStyle(20);

const settingsSectionsClassName = 'gap-6';

type SectionCardProps = {
  children: React.ReactNode;
  className?: string;
};

const SectionIntro = () => (
  <View className="mx-4 mt-3 mb-1 rounded-3xl border border-glass-border bg-md-surface/80 px-5 py-5 shadow-glass">
    <View className="flex-row items-center gap-3">
      <View className="h-11 w-11 items-center justify-center rounded-2xl bg-md-primary/12 border border-glass-border">
        <Ionicons name="options-outline" size={20} color="var(--color-md-primary)" />
      </View>
      <View className="flex-1 gap-1">
        <Text className="text-lg font-bold text-md-on-surface">偏好設定</Text>
        <Text className="text-sm leading-5 text-md-on-surface-variant">
          調整資料來源、顯示模式與單位，讓天氣資訊更符合你的使用習慣。
        </Text>
      </View>
    </View>
  </View>
);

const SectionCard = ({ children, className = '' }: SectionCardProps) => (
  <View className={`${glassCardClassName} ${className}`.trim()} style={glassCardStyle}>
    {children}
  </View>
);

const SectionHeader = ({
  title,
  icon,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
}) => (
  <View className="flex-row items-center gap-2.5 px-4 pb-2 pt-1">
    <View className="h-6 w-6 items-center justify-center rounded-full bg-md-primary/12">
      <Ionicons name={icon} size={13} color="var(--color-md-primary)" />
    </View>
    <Text className="text-xs font-bold tracking-[1.6px] text-md-primary uppercase">{title}</Text>
  </View>
);

const OptionContent = ({
  label,
  description,
}: {
  label: string;
  description?: string | undefined;
}) => (
  <View className="flex-1 gap-1 pr-4">
    <Text className="text-[15px] font-semibold leading-5 text-md-on-surface">{label}</Text>
    {description && (
      <Text className="text-xs leading-5 text-md-on-surface-variant">{description}</Text>
    )}
  </View>
);

const RadioOption = ({
  label,
  description,
  value,
  selectedValue,
  onPress,
  isLast = false,
}: {
  label: string;
  description?: string;
  value: string;
  selectedValue: string;
  onPress: () => void;
  isLast?: boolean;
}) => (
  <TouchableOpacity
    onPress={onPress}
    className={`min-h-14 px-4 py-4 flex-row items-center justify-between bg-md-surface ${
      !isLast ? 'border-b border-glass-border' : ''
    }`}
  >
    <OptionContent label={label} description={description} />
    <RadioButton selected={value === selectedValue} />
  </TouchableOpacity>
);

const SourceToggleComponent = ({
  label,
  description,
  source,
  enabledSources,
  toggleSource,
  isLast = false,
}: {
  label: string;
  description?: string;
  source: WeatherSource;
  enabledSources: WeatherSource[];
  toggleSource: (source: WeatherSource) => void;
  isLast?: boolean;
}) => {
  const isEnabled = enabledSources.includes(source);
  return (
    <View
      className={`min-h-14 px-4 py-4 bg-md-surface flex-row items-center justify-between ${
        !isLast ? 'border-b border-glass-border' : ''
      }`}
    >
      <OptionContent label={label} description={description} />
      <Switch
        value={isEnabled}
        onValueChange={() => toggleSource(source)}
        trackColor={{ false: 'var(--color-md-surface-variant)', true: 'var(--color-md-primary)' }}
        thumbColor={isEnabled ? 'var(--color-md-on-primary)' : 'var(--color-md-outline)'}
      />
    </View>
  );
};

const sourceOptions: Array<{
  label: string;
  description: string;
  source: WeatherSource;
}> = [
  {
    label: '中央氣象署（CWA）',
    description: '台灣最精準，含即時觀測',
    source: 'cwa',
  },
  {
    label: 'Open-Meteo',
    description: '免費無限制，歷史資料豐富',
    source: 'open-meteo',
  },
  {
    label: 'WeatherAPI',
    description: '備用來源，7 天歷史',
    source: 'weatherapi',
  },
  {
    label: 'OpenWeatherMap',
    description: '全球覆蓋，備用資料源',
    source: 'openweathermap',
  },
];

const displayModeOptions = [
  {
    label: '單一資料源',
    description: '使用優先順序最高的來源',
    value: 'single',
  },
  {
    label: '聚合模式',
    description: '整合多個來源取得最佳預測',
    value: 'aggregate',
  },
] as const;

const temperatureOptions = [
  { label: '攝氏 (°C)', value: 'celsius' },
  { label: '華氏 (°F)', value: 'fahrenheit' },
] as const;

const windSpeedOptions = [
  { label: '公里/小時 (km/h)', value: 'kmh' },
  { label: '公尺/秒 (m/s)', value: 'ms' },
  { label: '英里/小時 (mph)', value: 'mph' },
] as const;

const locationDisplayOptions: Array<{
  label: string;
  description: string;
  value: LocationDisplayFormat;
}> = [
  {
    label: '鄉鎮市（預設）',
    description: '僅顯示鄉鎮市區名稱',
    value: 'township',
  },
  {
    label: '縣市 / 鄉鎮市',
    description: '同時顯示縣市與鄉鎮市區',
    value: 'city-township',
  },
  {
    label: '完整地址層級',
    description: '顯示國家、縣市、鄉鎮市與鄰里',
    value: 'full',
  },
];

const themeOptions = [
  { label: '亮色模式', value: 'light' },
  { label: '暗色模式', value: 'dark' },
  { label: '跟隨系統', value: 'system' },
] as const;

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const {
    theme,
    displayMode,
    temperatureUnit,
    windSpeedUnit,
    locationDisplayFormat,
    enabledSources,
    setTheme,
    setDisplayMode,
    setTemperatureUnit,
    setWindSpeedUnit,
    setLocationDisplayFormat,
    toggleSource,
  } = useSettingsStore();

  return (
    <GlassBackground>
      <BlurDecorative color="secondary" size="lg" position="bottom-right" opacity={0.1} />
      <BlurDecorative color="accent" size="lg" position="top-left" opacity={0.05} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingBottom: insets.bottom + 88,
          paddingTop: 4,
        }}
      >
        <SectionIntro />

        <View className={settingsSectionsClassName}>
          <View>
            <SectionHeader title="資料來源" icon="cloud-outline" />
            <SectionCard>
              {sourceOptions.map((option, index) => (
                <SourceToggleComponent
                  key={option.source}
                  label={option.label}
                  description={option.description}
                  source={option.source}
                  enabledSources={enabledSources}
                  toggleSource={toggleSource}
                  isLast={index === sourceOptions.length - 1}
                />
              ))}
            </SectionCard>
          </View>

          <View>
            <SectionHeader title="顯示模式" icon="layers-outline" />
            <SectionCard>
              {displayModeOptions.map((option, index) => (
                <RadioOption
                  key={option.value}
                  label={option.label}
                  description={option.description}
                  value={option.value}
                  selectedValue={displayMode}
                  onPress={() => setDisplayMode(option.value)}
                  isLast={index === displayModeOptions.length - 1}
                />
              ))}
            </SectionCard>
          </View>

          <View>
            <SectionHeader title="溫度單位" icon="thermometer-outline" />
            <SectionCard>
              {temperatureOptions.map((option, index) => (
                <RadioOption
                  key={option.value}
                  label={option.label}
                  value={option.value}
                  selectedValue={temperatureUnit}
                  onPress={() => setTemperatureUnit(option.value)}
                  isLast={index === temperatureOptions.length - 1}
                />
              ))}
            </SectionCard>
          </View>

          <View>
            <SectionHeader title="風速單位" icon="speedometer-outline" />
            <SectionCard>
              {windSpeedOptions.map((option, index) => (
                <RadioOption
                  key={option.value}
                  label={option.label}
                  value={option.value}
                  selectedValue={windSpeedUnit}
                  onPress={() => setWindSpeedUnit(option.value)}
                  isLast={index === windSpeedOptions.length - 1}
                />
              ))}
            </SectionCard>
          </View>

          <View>
            <SectionHeader title="地點顯示" icon="location-outline" />
            <SectionCard>
              {locationDisplayOptions.map((option, index) => (
                <RadioOption
                  key={option.value}
                  label={option.label}
                  description={option.description}
                  value={option.value}
                  selectedValue={locationDisplayFormat}
                  onPress={() => setLocationDisplayFormat(option.value)}
                  isLast={index === locationDisplayOptions.length - 1}
                />
              ))}
            </SectionCard>
          </View>

          <View className="mb-4">
            <SectionHeader title="主題外觀" icon="contrast-outline" />
            <SectionCard>
              {themeOptions.map((option, index) => (
                <RadioOption
                  key={option.value}
                  label={option.label}
                  value={option.value}
                  selectedValue={theme}
                  onPress={() => setTheme(option.value)}
                  isLast={index === themeOptions.length - 1}
                />
              ))}
            </SectionCard>
          </View>
        </View>
      </ScrollView>
    </GlassBackground>
  );
}
