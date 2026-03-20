import React from 'react';
import { Switch, View } from 'react-native';

import { WEATHER_SOURCES } from '@/api/sources';
import type { AggregationConfig, WeatherSource } from '@/api/types';
import { BlurDecorative } from '@/components/ui/BlurDecorative';
import { GlassBackground } from '@/components/ui/GlassBackground';
import { PageHeaderCard } from '@/components/ui/PageHeaderCard';
import { PageScrollView } from '@/components/ui/PageScrollView';
import { RadioSettingOption, SettingsRow } from '@/components/ui/settings/SettingsRow';
import { SettingsSection } from '@/components/ui/settings/SettingsSection';
import { useSettingsStore } from '@/store/settings.store';

function SourcesContent({
  enabledSources,
  toggleSource,
}: {
  enabledSources: WeatherSource[];
  toggleSource: (source: WeatherSource) => void;
}) {
  return (
    <>
      {WEATHER_SOURCES.map((sourceMeta, index) => {
        const source = sourceMeta.id;
        const isEnabled = enabledSources.includes(source);
        const isLast = index === WEATHER_SOURCES.length - 1;
        return (
          <SettingsRow
            key={sourceMeta.id}
            title={sourceMeta.label}
            trailing={
              <Switch
                accessibilityLabel={`${sourceMeta.label} 開關`}
                value={isEnabled}
                onValueChange={() => toggleSource(source)}
                trackColor={{
                  false: 'var(--color-md-surface-variant)',
                  true: 'var(--color-md-primary)',
                }}
                thumbColor={isEnabled ? 'var(--color-md-on-primary)' : 'var(--color-md-outline)'}
              />
            }
            isLast={isLast}
            accessibilityRole="switch"
            accessibilityState={{ checked: isEnabled }}
          />
        );
      })}
    </>
  );
}

// ---------------------------------------------------------------------------
// Aggregation section content
// ---------------------------------------------------------------------------

const TEMP_OPTIONS = [
  { label: '平均溫度', description: '取所有來源的平均值', value: 'average' as const },
  { label: '中位數溫度', description: '取所有來源的中位數', value: 'median' as const },
  { label: '聯集範圍', description: '取最低與最高的聯集', value: 'union' as const },
];

const PRECIP_OPTIONS = [
  { label: '任一有雨', description: '任一來源預報有雨即顯示', value: 'any' as const },
  { label: '多數有雨', description: '超過半數來源預報有雨', value: 'half' as const },
  { label: '全部有雨', description: '所有來源都預報有雨', value: 'all' as const },
];

function AggregationContent({
  config,
  setConfig,
}: {
  config: AggregationConfig;
  setConfig: (c: AggregationConfig) => void;
}) {
  return (
    <>
      <SettingsRow title="溫度聚合方式" compact isLast />
      {TEMP_OPTIONS.map((opt, i) => (
        <RadioSettingOption
          key={opt.value}
          title={opt.label}
          description={opt.description}
          value={opt.value}
          selectedValue={String(config.temperature)}
          onPress={() => setConfig({ ...config, temperature: opt.value })}
          isLast={i === TEMP_OPTIONS.length - 1}
        />
      ))}
      <View className="border-t border-white/12">
        <SettingsRow title="降雨判斷方式" compact isLast />
      </View>
      {PRECIP_OPTIONS.map((opt, i) => (
        <RadioSettingOption
          key={opt.value}
          title={opt.label}
          description={opt.description}
          value={opt.value}
          selectedValue={String(config.precipitation)}
          onPress={() => setConfig({ ...config, precipitation: opt.value })}
          isLast={i === PRECIP_OPTIONS.length - 1}
        />
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getAggregationSummary(config: AggregationConfig): string {
  const temp =
    config.temperature === 'average' ? '平均' : config.temperature === 'median' ? '中位數' : '聯集';
  const precip =
    config.precipitation === 'any' ? '任一' : config.precipitation === 'half' ? '多數' : '全部';
  return `溫度：${temp} / 降雨：${precip}`;
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function SettingsScreen() {
  const {
    displayMode,
    enabledSources,
    aggregationConfig,
    activeSource,
    setDisplayMode,
    setActiveSource,
    setAggregationConfig,
    toggleSource,
  } = useSettingsStore();

  const activeSourceLabel = WEATHER_SOURCES.find((s) => s.id === activeSource)?.label ?? '未選擇';

  const availableSources = WEATHER_SOURCES.filter((s) => enabledSources.includes(s.id));

  return (
    <GlassBackground>
      <BlurDecorative color="secondary" size="xl" position="bottom-right" opacity={0.1} />
      <BlurDecorative color="accent" size="lg" position="top-left" opacity={0.08} />
      <BlurDecorative color="primary" size="md" position="center" opacity={0.05} />

      <PageScrollView contentContainerStyle={{ paddingTop: 8 }} bottomOffset={156} maxWidth={720}>
        <PageHeaderCard icon="options-outline" title="偏好設定" eyebrow="體驗與資料" />

        <View className="gap-6">
          {/* 資料來源 */}
          <SettingsSection icon="cloud-outline" title="資料來源">
            <SourcesContent enabledSources={enabledSources} toggleSource={toggleSource} />
          </SettingsSection>

          {/* 顯示模式 */}
          <SettingsSection icon="layers-outline" title="顯示模式">
            <RadioSettingOption
              title="單一資料源"
              value="single"
              selectedValue={displayMode}
              onPress={() => setDisplayMode('single')}
              compact
            />
            <RadioSettingOption
              title="聚合模式"
              value="aggregate"
              selectedValue={displayMode}
              onPress={() => setDisplayMode('aggregate')}
              compact
              isLast
            />
          </SettingsSection>

          {/* 主要資料源 (single mode) */}
          {displayMode === 'single' && (
            <SettingsSection icon="navigate-outline" title="主要資料源" summary={activeSourceLabel}>
              {availableSources.map((s, i) => (
                <RadioSettingOption
                  key={s.id}
                  title={s.label}
                  value={s.id}
                  selectedValue={activeSource}
                  onPress={() => setActiveSource(s.id)}
                  compact
                  isLast={i === availableSources.length - 1}
                />
              ))}
            </SettingsSection>
          )}

          {/* 聚合規則 (aggregate mode) */}
          {displayMode === 'aggregate' && (
            <SettingsSection
              icon="options-outline"
              title="聚合規則"
              summary={getAggregationSummary(aggregationConfig)}
            >
              <AggregationContent config={aggregationConfig} setConfig={setAggregationConfig} />
            </SettingsSection>
          )}
        </View>
      </PageScrollView>
    </GlassBackground>
  );
}
