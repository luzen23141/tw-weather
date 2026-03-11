import { Ionicons } from '@expo/vector-icons';
import { Pressable, Switch, Text, View, Platform } from 'react-native';

import type { LocationDisplayFormat, WeatherSource } from '@/api/types';
import { BlurDecorative } from '@/components/ui/BlurDecorative';
import { GlassBackground } from '@/components/ui/GlassBackground';
import { PageHeaderCard } from '@/components/ui/PageHeaderCard';
import { PageScrollView } from '@/components/ui/PageScrollView';
import { RadioButton } from '@/components/ui/RadioButton';
import { useSettingsStore } from '@/store/settings.store';
import { getGlassStyle } from '@/utils/glass';

const glassCardClassName =
  'mx-4 overflow-hidden rounded-3xl border border-glass-border-strong bg-md-surface-container shadow-glass';
const glassCardStyle = getGlassStyle(20);
const isWeb = Platform.OS === 'web';

const settingsSectionsClassName = 'gap-6';
const webColumnsClassName = 'flex-row items-start gap-1';
const webColumnClassName = 'flex-1 gap-6 px-2';

type SectionCardProps = {
  children: React.ReactNode;
  className?: string;
};

type SettingsSectionKey = 'sources' | 'display-mode' | 'location-display';

type SettingsSectionConfig = {
  key: SettingsSectionKey;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  className?: string;
};

const settingsSectionConfigs: SettingsSectionConfig[] = [
  { key: 'sources', title: '資料來源', icon: 'cloud-outline' },
  { key: 'display-mode', title: '顯示模式', icon: 'layers-outline' },
  { key: 'location-display', title: '地點顯示', icon: 'location-outline', className: 'mb-4' },
];

const webSectionColumns: SettingsSectionKey[][] = [
  ['sources', 'display-mode'],
  ['location-display'],
];

const SectionIntro = () => (
  <PageHeaderCard
    icon="options-outline"
    title="偏好設定"
    subtitle="調整資料來源、顯示模式與單位，讓天氣資訊更符合你的使用習慣。"
    eyebrow="主題、來源與顯示規則"
  />
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
    <Text className="text-[11px] font-bold tracking-[1.2px] text-md-primary uppercase">
      {title}
    </Text>
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
      <Text className="text-[13px] leading-5 text-md-on-surface-variant">{description}</Text>
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
  <Pressable
    accessibilityRole="radio"
    accessibilityLabel={label}
    accessibilityHint={description}
    accessibilityState={{ checked: value === selectedValue }}
    onPress={onPress}
    className={`min-h-14 flex-row items-center justify-between bg-md-surface-container px-4 py-4 active:opacity-90 ${
      !isLast ? 'border-b border-glass-border' : ''
    }`}
    style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1 }]}
  >
    <OptionContent label={label} description={description} />
    <RadioButton selected={value === selectedValue} />
  </Pressable>
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
      className={`min-h-14 bg-md-surface-container px-4 py-4 flex-row items-center justify-between ${
        !isLast ? 'border-b border-glass-border' : ''
      }`}
    >
      <OptionContent label={label} description={description} />
      <Switch
        accessibilityLabel={`${label} 開關`}
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

const SettingsSection = ({
  section,
  children,
}: {
  section: SettingsSectionConfig;
  children: React.ReactNode;
}) => (
  <View className={section.className ?? ''}>
    <SectionHeader title={section.title} icon={section.icon} />
    <SectionCard>{children}</SectionCard>
  </View>
);

export default function SettingsScreen() {
  const {
    displayMode,
    locationDisplayFormat,
    enabledSources,
    setDisplayMode,
    setLocationDisplayFormat,
    toggleSource,
  } = useSettingsStore();

  const renderSection = (key: SettingsSectionKey) => {
    switch (key) {
      case 'sources':
        return sourceOptions.map((option, index) => (
          <SourceToggleComponent
            key={option.source}
            label={option.label}
            description={option.description}
            source={option.source}
            enabledSources={enabledSources}
            toggleSource={toggleSource}
            isLast={index === sourceOptions.length - 1}
          />
        ));
      case 'display-mode':
        return displayModeOptions.map((option, index) => (
          <RadioOption
            key={option.value}
            label={option.label}
            description={option.description}
            value={option.value}
            selectedValue={displayMode}
            onPress={() => setDisplayMode(option.value)}
            isLast={index === displayModeOptions.length - 1}
          />
        ));
      case 'location-display':
        return locationDisplayOptions.map((option, index) => (
          <RadioOption
            key={option.value}
            label={option.label}
            description={option.description}
            value={option.value}
            selectedValue={locationDisplayFormat}
            onPress={() => setLocationDisplayFormat(option.value)}
            isLast={index === locationDisplayOptions.length - 1}
          />
        ));
    }
  };

  return (
    <GlassBackground>
      <BlurDecorative color="secondary" size="lg" position="bottom-right" opacity={0.1} />
      <BlurDecorative color="accent" size="lg" position="top-left" opacity={0.05} />

      <PageScrollView
        contentContainerStyle={{
          paddingTop: 8,
        }}
        bottomOffset={isWeb ? 260 : 156}
      >
        <SectionIntro />

        {isWeb ? (
          <View className={webColumnsClassName}>
            {webSectionColumns.map((sectionKeys, columnIndex) => (
              <View key={columnIndex} className={webColumnClassName}>
                {sectionKeys.map((key) => {
                  const section = settingsSectionConfigs.find((item) => item.key === key);
                  if (!section) {
                    return null;
                  }

                  return (
                    <SettingsSection key={section.key} section={section}>
                      {renderSection(section.key)}
                    </SettingsSection>
                  );
                })}
              </View>
            ))}
          </View>
        ) : (
          <View className={settingsSectionsClassName}>
            {settingsSectionConfigs.map((section) => (
              <SettingsSection key={section.key} section={section}>
                {renderSection(section.key)}
              </SettingsSection>
            ))}
          </View>
        )}
      </PageScrollView>
    </GlassBackground>
  );
}
