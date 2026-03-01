import { Ionicons } from '@expo/vector-icons';
import { ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { WeatherSource } from '@/api/types';
import { BlurDecorative } from '@/components/ui/BlurDecorative';
import { GlassBackground } from '@/components/ui/GlassBackground';
import { RadioButton } from '@/components/ui/RadioButton';
import { useSettingsStore } from '@/store/settings.store';
import { getGlassStyle } from '@/utils/glass';

const SectionHeader = ({
  title,
  icon,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
}) => (
  <View className="flex-row items-center gap-2 mt-7 mb-2 px-4">
    <Ionicons name={icon} size={14} color="var(--color-md-primary)" />
    <Text className="text-xs font-bold text-md-primary uppercase tracking-wider">{title}</Text>
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
    className={`px-4 py-4 flex-row items-center justify-between bg-md-surface ${
      !isLast ? 'border-b border-glass-border' : ''
    }`}
  >
    <View className="flex-1 gap-0.5">
      <Text className="text-sm font-medium text-md-on-surface">{label}</Text>
      {description && (
        <Text className="text-xs text-md-on-surface-variant mt-0.5">{description}</Text>
      )}
    </View>
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
      className={`px-4 py-4 bg-md-surface flex-row items-center justify-between ${
        !isLast ? 'border-b border-glass-border' : ''
      }`}
    >
      <View className="flex-1 gap-0.5">
        <Text className="text-sm font-medium text-md-on-surface">{label}</Text>
        {description && (
          <Text className="text-xs text-md-on-surface-variant mt-0.5">{description}</Text>
        )}
      </View>
      <Switch
        value={isEnabled}
        onValueChange={() => toggleSource(source)}
        trackColor={{ false: 'var(--color-md-surface-variant)', true: 'var(--color-md-primary)' }}
        thumbColor={isEnabled ? 'var(--color-md-on-primary)' : 'var(--color-md-outline)'}
      />
    </View>
  );
};

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const {
    theme,
    displayMode,
    temperatureUnit,
    windSpeedUnit,
    enabledSources,
    setTheme,
    setDisplayMode,
    setTemperatureUnit,
    setWindSpeedUnit,
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
        {/* 資料源區塊 */}
        <SectionHeader title="資料來源" icon="cloud-outline" />
        <View
          className="mx-4 rounded-3xl overflow-hidden border border-glass-border shadow-glass"
          style={getGlassStyle(20)}
        >
          <SourceToggleComponent
            label="中央氣象署（CWA）"
            description="台灣最精準，含即時觀測"
            source="cwa"
            enabledSources={enabledSources}
            toggleSource={toggleSource}
          />
          <SourceToggleComponent
            label="Open-Meteo"
            description="免費無限制，歷史資料豐富"
            source="open-meteo"
            enabledSources={enabledSources}
            toggleSource={toggleSource}
          />
          <SourceToggleComponent
            label="WeatherAPI"
            description="備用來源，7 天歷史"
            source="weatherapi"
            enabledSources={enabledSources}
            toggleSource={toggleSource}
          />
          <SourceToggleComponent
            label="OpenWeatherMap"
            description="全球覆蓋，備用資料源"
            source="openweathermap"
            enabledSources={enabledSources}
            toggleSource={toggleSource}
            isLast
          />
        </View>

        {/* 顯示模式 */}
        <SectionHeader title="顯示模式" icon="layers-outline" />
        <View
          className="mx-4 rounded-3xl overflow-hidden border border-glass-border shadow-glass"
          style={getGlassStyle(20)}
        >
          <RadioOption
            label="單一資料源"
            description="使用優先順序最高的來源"
            value="single"
            selectedValue={displayMode}
            onPress={() => setDisplayMode('single')}
          />
          <RadioOption
            label="聚合模式"
            description="整合多個來源取得最佳預測"
            value="aggregate"
            selectedValue={displayMode}
            onPress={() => setDisplayMode('aggregate')}
            isLast
          />
        </View>

        {/* 溫度單位 */}
        <SectionHeader title="溫度單位" icon="thermometer-outline" />
        <View
          className="mx-4 rounded-3xl overflow-hidden border border-glass-border shadow-glass"
          style={getGlassStyle(20)}
        >
          <RadioOption
            label="攝氏 (°C)"
            value="celsius"
            selectedValue={temperatureUnit}
            onPress={() => setTemperatureUnit('celsius')}
          />
          <RadioOption
            label="華氏 (°F)"
            value="fahrenheit"
            selectedValue={temperatureUnit}
            onPress={() => setTemperatureUnit('fahrenheit')}
            isLast
          />
        </View>

        {/* 風速單位 */}
        <SectionHeader title="風速單位" icon="speedometer-outline" />
        <View
          className="mx-4 rounded-3xl overflow-hidden border border-glass-border shadow-glass"
          style={getGlassStyle(20)}
        >
          <RadioOption
            label="公里/小時 (km/h)"
            value="kmh"
            selectedValue={windSpeedUnit}
            onPress={() => setWindSpeedUnit('kmh')}
          />
          <RadioOption
            label="公尺/秒 (m/s)"
            value="ms"
            selectedValue={windSpeedUnit}
            onPress={() => setWindSpeedUnit('ms')}
          />
          <RadioOption
            label="英里/小時 (mph)"
            value="mph"
            selectedValue={windSpeedUnit}
            onPress={() => setWindSpeedUnit('mph')}
            isLast
          />
        </View>

        {/* 主題 */}
        <SectionHeader title="主題外觀" icon="contrast-outline" />
        <View
          className="mx-4 rounded-3xl overflow-hidden border border-glass-border shadow-glass mb-4"
          style={getGlassStyle(20)}
        >
          <RadioOption
            label="亮色模式"
            value="light"
            selectedValue={theme}
            onPress={() => setTheme('light')}
          />
          <RadioOption
            label="暗色模式"
            value="dark"
            selectedValue={theme}
            onPress={() => setTheme('dark')}
          />
          <RadioOption
            label="跟隨系統"
            value="system"
            selectedValue={theme}
            onPress={() => setTheme('system')}
            isLast
          />
        </View>
      </ScrollView>
    </GlassBackground>
  );
}
