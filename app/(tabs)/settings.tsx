import React from 'react';
import { Pressable, Switch, Text, View } from 'react-native';

import { PROVIDER_ID_TO_SOURCE, WEATHER_SOURCES } from '@/api/sources';
import type { AggregationConfig, WeatherSource } from '@/api/types';
import { AppIcon, type AppIconName } from '@/components/icons/AppIcon';
import { BlurDecorative } from '@/components/ui/BlurDecorative';
import { GlassBackground } from '@/components/ui/GlassBackground';
import { PageHeaderCard } from '@/components/ui/PageHeaderCard';
import { PageScrollView } from '@/components/ui/PageScrollView';
import { RadioButton } from '@/components/ui/RadioButton';
import { SkeletonBox, SkeletonProvider } from '@/components/ui/SkeletonLoader';
import { useProviders } from '@/hooks/useProviders';
import { useSettingsStore } from '@/store/settings.store';
import { getGlassStyle } from '@/components/ui/glass';

const glassCardClassName =
  'mx-4 overflow-hidden rounded-3xl border border-glass-border-strong bg-md-surface-container shadow-glass';
const glassCardStyle = getGlassStyle(20);

const settingsSectionsClassName = 'gap-6';

type SectionCardProps = {
  children: React.ReactNode;
  className?: string;
};

type SettingsSectionKey = 'appearance' | 'sources' | 'display-mode' | 'aggregation';

type SettingsSectionConfig = {
  key: SettingsSectionKey;
  title: string;
  icon: AppIconName;
  className?: string;
};

const settingsSectionConfigs: SettingsSectionConfig[] = [
  { key: 'appearance', title: '外觀', icon: 'color-palette-outline' },
  { key: 'sources', title: '資料來源', icon: 'cloud-outline' },
  { key: 'display-mode', title: '顯示模式', icon: 'layers-outline' },
  { key: 'aggregation', title: '聚合規則', icon: 'options-outline' },
];

const SectionIntro = () => (
  <PageHeaderCard
    icon="options-outline"
    title="偏好設定"
    subtitle="選擇資料來源與顯示方式，讓天氣資訊更符合你的需求。"
    eyebrow="來源與顯示設定"
  />
);

const SectionCard = ({ children, className = '' }: SectionCardProps) => (
  <View className={`${glassCardClassName} ${className}`.trim()} style={glassCardStyle}>
    {children}
  </View>
);

const SectionHeader = ({ title, icon }: { title: string; icon: AppIconName }) => (
  <View className="flex-row items-center gap-2.5 px-5 pb-3 pt-0.5">
    <View className="h-6 w-6 items-center justify-center rounded-full bg-md-primary/12">
      <AppIcon name={icon} size={13} color="var(--color-md-primary)" />
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
  <View className="flex-1 gap-1.5 pr-4">
    <Text className="text-[15px] font-semibold leading-5 text-md-on-surface">{label}</Text>
    {description && (
      <Text className="text-[13px] leading-[18px] text-md-on-surface-variant">{description}</Text>
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
    className={`min-h-[56px] flex-row items-center justify-between bg-md-surface-container px-5 py-3.5 active:opacity-90 ${
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
      className={`min-h-[56px] bg-md-surface-container px-5 py-3.5 flex-row items-center justify-between ${
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

/** 後端 provider.id 對應前端 WeatherSource 的映射（來自 sources registry） */
const providerIdToSource = PROVIDER_ID_TO_SOURCE;

type DisplaySource = {
  id: string;
  name: string;
  description?: string;
};

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

const AppearanceSection = React.memo(function AppearanceSection({
  theme,
  setTheme,
}: {
  theme: string;
  setTheme: (v: 'light' | 'dark') => void;
}) {
  return (
    <>
      {themeOptions.map((option, index) => (
        <RadioOption
          key={option.value}
          label={option.label}
          description={option.description}
          value={option.value}
          selectedValue={theme}
          onPress={() => setTheme(option.value)}
          isLast={index === themeOptions.length - 1}
        />
      ))}
    </>
  );
});

const DisplayModeSection = React.memo(function DisplayModeSection({
  displayMode,
  setDisplayMode,
}: {
  displayMode: string;
  setDisplayMode: (v: 'single' | 'aggregate') => void;
}) {
  return (
    <>
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
    </>
  );
});

const AggregationSection = React.memo(function AggregationSection({
  aggregationConfig,
  setAggregationConfig,
}: {
  aggregationConfig: AggregationConfig;
  setAggregationConfig: (c: AggregationConfig) => void;
}) {
  const tempOptions = [
    { label: '平均溫度', description: '取所有來源的平均值', value: 'average' as const },
    { label: '中位數溫度', description: '取所有來源的中位數', value: 'median' as const },
    { label: '聯集範圍', description: '取最低與最高的聯集', value: 'union' as const },
  ];
  const precipOptions = [
    { label: '任一有雨', description: '任一來源預報有雨即顯示', value: 'any' as const },
    { label: '多數有雨', description: '超過半數來源預報有雨', value: 'half' as const },
    { label: '全部有雨', description: '所有來源都預報有雨', value: 'all' as const },
  ];
  return (
    <>
      <View className="px-5 pt-3 pb-1">
        <Text className="text-xs text-md-on-surface-variant">溫度聚合方式</Text>
      </View>
      {tempOptions.map((option, index) => (
        <RadioOption
          key={option.value}
          label={option.label}
          description={option.description}
          value={option.value}
          selectedValue={String(aggregationConfig.temperature)}
          onPress={() => setAggregationConfig({ ...aggregationConfig, temperature: option.value })}
          isLast={index === tempOptions.length - 1}
        />
      ))}
      <View className="px-5 pt-3 pb-1 border-t border-glass-border">
        <Text className="text-xs text-md-on-surface-variant">降雨判斷方式</Text>
      </View>
      {precipOptions.map((option, index) => (
        <RadioOption
          key={option.value}
          label={option.label}
          description={option.description}
          value={option.value}
          selectedValue={String(aggregationConfig.precipitation)}
          onPress={() =>
            setAggregationConfig({ ...aggregationConfig, precipitation: option.value })
          }
          isLast={index === precipOptions.length - 1}
        />
      ))}
    </>
  );
});

const themeOptions = [
  {
    label: '淺色模式',
    description: '明亮的介面風格',
    value: 'light',
  },
  {
    label: '深色模式',
    description: '適合夜間使用，減少眼睛疲勞',
    value: 'dark',
  },
] as const;

export default function SettingsScreen() {
  const {
    theme,
    displayMode,
    enabledSources,
    aggregationConfig,
    setTheme,
    setDisplayMode,
    setAggregationConfig,
    toggleSource,
  } = useSettingsStore();
  const { data: providers, error: providersError, refetch: refetchProviders } = useProviders();

  const sourcesContent = (() => {
    if (providersError) {
      return (
        <View className="min-h-[56px] items-center justify-center gap-3 px-5 py-4">
          <Text className="text-sm text-md-error">無法載入資料來源清單</Text>
          <Pressable
            onPress={() => {
              void refetchProviders();
            }}
            className="rounded-xl bg-md-primary/10 px-4 py-2"
          >
            <Text className="text-sm font-semibold text-md-primary">重試</Text>
          </Pressable>
        </View>
      );
    }

    if (!providers) {
      return (
        <SkeletonProvider>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              className={`min-h-[56px] bg-md-surface-container px-5 py-3.5 flex-row items-center justify-between ${
                i < 2 ? 'border-b border-glass-border' : ''
              }`}
            >
              <View className="flex-1 gap-2 pr-4">
                <SkeletonBox height={14} width="42%" borderRadius={5} />
                <SkeletonBox height={12} width="68%" borderRadius={4} />
              </View>
              <SkeletonBox height={28} width={50} borderRadius={14} />
            </View>
          ))}
        </SkeletonProvider>
      );
    }

    const filteredProviders: DisplaySource[] = providers
      .filter((p) => p.id in providerIdToSource)
      .map((p) => ({ id: p.id, name: p.name, description: p.description }));
    const displayList: DisplaySource[] =
      filteredProviders.length > 0
        ? filteredProviders
        : WEATHER_SOURCES.map((s) => ({ id: s.providerId, name: s.label }));
    return displayList.map((p, index, arr) => {
      const source = providerIdToSource[p.id] as WeatherSource;
      return (
        <SourceToggleComponent
          key={p.id}
          label={p.name}
          {...(p.description ? { description: p.description } : {})}
          source={source}
          enabledSources={enabledSources}
          toggleSource={toggleSource}
          isLast={index === arr.length - 1}
        />
      );
    });
  })();

  return (
    <GlassBackground>
      <BlurDecorative color="secondary" size="lg" position="bottom-right" opacity={0.06} />
      <BlurDecorative color="accent" size="lg" position="top-left" opacity={0.04} />

      <PageScrollView
        contentContainerStyle={{
          paddingTop: 8,
        }}
        bottomOffset={156}
        maxWidth={720}
      >
        <SectionIntro />

        <View className={settingsSectionsClassName}>
          {settingsSectionConfigs[0] !== undefined && (
            <SettingsSection section={settingsSectionConfigs[0]}>
              <AppearanceSection theme={theme} setTheme={setTheme} />
            </SettingsSection>
          )}
          {settingsSectionConfigs[1] !== undefined && (
            <SettingsSection section={settingsSectionConfigs[1]}>{sourcesContent}</SettingsSection>
          )}
          {settingsSectionConfigs[2] !== undefined && (
            <SettingsSection section={settingsSectionConfigs[2]}>
              <DisplayModeSection displayMode={displayMode} setDisplayMode={setDisplayMode} />
            </SettingsSection>
          )}
          {displayMode === 'aggregate' && settingsSectionConfigs[3] !== undefined && (
            <SettingsSection section={settingsSectionConfigs[3]}>
              <AggregationSection
                aggregationConfig={aggregationConfig}
                setAggregationConfig={setAggregationConfig}
              />
            </SettingsSection>
          )}
        </View>
      </PageScrollView>
    </GlassBackground>
  );
}
