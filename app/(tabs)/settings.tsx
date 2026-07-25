import React from 'react';
import { View } from 'react-native';

import { WEATHER_SOURCES } from '@/api/sources';
import type { AggregationConfig, WeatherSource } from '@/api/types';
import type { Provider } from '@/api/providers';
import { useProviders } from '@/hooks/useProviders';
import { GlassBackground } from '@/components/ui/GlassBackground';
import { PageScrollView } from '@/components/ui/PageScrollView';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { useMDColors } from '@/hooks/useMDColors';
import { RadioSettingOption, SettingsRow } from '@/components/ui/settings/SettingsRow';
import { SettingsSection } from '@/components/ui/settings/SettingsSection';
import { useSettingsStore } from '@/store/settings.store';

/** 「多數有雨」需要至少三個來源才有意義，見 precipOptionsFor */
const MIN_SOURCES_FOR_MAJORITY = 3;

function SwitchIndicator({ checked }: { checked: boolean }) {
  const colors = useMDColors();

  return (
    <View
      className={`h-7 w-12 justify-center rounded-full border px-0.5 ${
        checked ? 'border-white/28 bg-white/18' : 'border-white/16 bg-white/10'
      }`}
    >
      <View
        className="h-5 w-5 rounded-full"
        style={{
          backgroundColor: checked ? colors.primary : 'rgba(255,255,255,0.7)',
          transform: [{ translateX: checked ? 19 : 0 }],
        }}
      />
    </View>
  );
}

/*
 * 資料源清單來自後端 /api/provider/list，而非前端寫死。
 *
 * 有哪些來源、顯示名稱、能不能用（金鑰是否配置）都是伺服器的事實 ——
 * 前端寫死一份等於維護第二份會漂移的真相。unconfigured 的來源直接停用
 * 開關並說明原因，而不是讓使用者選了之後收到一串錯誤。
 *
 * 載入失敗時退回本地的 WEATHER_SOURCES 常數：設定頁不能因為一個列表
 * 請求失敗就整個不能操作。
 */
function SourcesContent({
  enabledSources,
  toggleSource,
}: {
  enabledSources: WeatherSource[];
  toggleSource: (source: WeatherSource) => void;
}) {
  const { data: providers, isLoading, isError } = useProviders();

  const list: Provider[] =
    providers ??
    WEATHER_SOURCES.map((meta) => ({
      id: meta.id,
      name: meta.label,
      description: '',
      status: 'available' as const,
    }));

  if (isLoading && providers === undefined) {
    return <SettingsRow title="載入資料源清單…" compact isLast />;
  }

  return (
    <>
      {isError ? (
        <SettingsRow
          title="無法取得資料源清單"
          description="顯示的是本機預設值，狀態可能不準確"
          compact
        />
      ) : null}
      {list.map((provider, index) => {
        const isEnabled = enabledSources.includes(provider.id);
        const isLast = index === list.length - 1;
        const unconfigured = provider.status === 'unconfigured';
        return (
          <SettingsRow
            key={provider.id}
            title={provider.name}
            description={
              unconfigured ? '伺服器未配置此來源的金鑰' : provider.description || undefined
            }
            trailing={<SwitchIndicator checked={isEnabled && !unconfigured} />}
            isLast={isLast}
            accessibilityRole="switch"
            accessibilityState={{ checked: isEnabled, disabled: unconfigured }}
            selected={isEnabled}
            disabled={unconfigured}
            onPress={unconfigured ? undefined : () => toggleSource(provider.id)}
          />
        );
      })}
    </>
  );
}

const TEMP_OPTIONS = [
  { label: '平均溫度', description: '取所有來源的平均值', value: 'average' as const },
  { label: '中位數溫度', description: '取所有來源的中位數', value: 'median' as const },
  {
    label: '極值中間值',
    // 名稱與說明必須對得上實作。這個選項原本叫「聯集範圍」、說明寫「取最低與最高的
    // 聯集」，但 aggregateTemperature 算出 min/max 之後回傳的是 (min + max) / 2 ——
    // 使用者選了以為會看到一個範圍，實際拿到單一數字。
    // TODO: 資料層改為保留範圍後，這個選項應改回真正的聯集並更新說明。
    description: '取最低與最高的中間值',
    value: 'union' as const,
  },
];

const PRECIP_ANY = {
  label: '任一有雨',
  description: '任一來源預報有雨即顯示',
  value: 'any' as const,
};
const PRECIP_HALF = {
  label: '多數有雨',
  description: '超過半數來源預報有雨',
  value: 'half' as const,
};
const PRECIP_ALL = {
  label: '全部有雨',
  description: '所有來源都預報有雨',
  value: 'all' as const,
};

/**
 * 依啟用的來源數量決定可選的降雨判斷方式。
 *
 * 只有兩個來源時「多數有雨」（超過半數 = 至少 1 個）與「任一有雨」在數學上完全
 * 等價 —— 提供一個永遠不會改變結果的選項，比不提供更糟：使用者會以為自己調整了
 * 什麼，然後困惑為什麼畫面沒變。
 */
function precipOptionsFor(sourceCount: number) {
  return sourceCount >= MIN_SOURCES_FOR_MAJORITY
    ? [PRECIP_ANY, PRECIP_HALF, PRECIP_ALL]
    : [PRECIP_ANY, PRECIP_ALL];
}

function AggregationContent({
  config,
  setConfig,
  sourceCount,
}: {
  config: AggregationConfig;
  setConfig: (c: AggregationConfig) => void;
  sourceCount: number;
}) {
  const precipOptions = precipOptionsFor(sourceCount);

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
      {precipOptions.map((opt, i) => (
        <RadioSettingOption
          key={opt.value}
          title={opt.label}
          description={opt.description}
          value={opt.value}
          selectedValue={String(config.precipitation)}
          onPress={() => setConfig({ ...config, precipitation: opt.value })}
          isLast={i === precipOptions.length - 1}
        />
      ))}
    </>
  );
}

function getAggregationSummary(config: AggregationConfig): string {
  const temp =
    config.temperature === 'average'
      ? '平均'
      : config.temperature === 'median'
        ? '中位數'
        : '極值中間值';
  const precip =
    config.precipitation === 'any' ? '任一' : config.precipitation === 'half' ? '多數' : '全部';
  return `溫度：${temp} / 降雨：${precip}`;
}

/**
 * 偏好設定。
 *
 * 沿用首頁與歷史頁的視覺語言：不用 PageHeaderCard（那會在每頁頂端各放一張大卡，
 * 佔掉首屏卻只承載一個標題），改用輕量的 SectionLabel。裝飾性模糊圓也一併移除 ——
 * 在半透明玻璃上疊光斑會讓同一段文字在不同位置有不同對比度。
 */
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
      <PageScrollView contentContainerStyle={{ paddingTop: 8 }} bottomOffset={156} maxWidth={720}>
        <View className="gap-5">
          <View className="gap-2">
            <SectionLabel>資料來源</SectionLabel>
            <SettingsSection icon="cloud-outline" title="啟用的來源">
              <SourcesContent enabledSources={enabledSources} toggleSource={toggleSource} />
            </SettingsSection>
          </View>

          <View className="gap-2">
            <SectionLabel>顯示方式</SectionLabel>
            <SettingsSection icon="layers-outline" title="顯示模式">
              <RadioSettingOption
                title="單一資料源"
                description="只採用一個來源的數值"
                value="single"
                selectedValue={displayMode}
                onPress={() => setDisplayMode('single')}
              />
              <RadioSettingOption
                title="聚合模式"
                description="合併多個來源，依下方規則計算"
                value="aggregate"
                selectedValue={displayMode}
                onPress={() => setDisplayMode('aggregate')}
                isLast
              />
            </SettingsSection>
          </View>

          {displayMode === 'single' ? (
            <View className="gap-2">
              <SectionLabel>主要資料源</SectionLabel>
              <SettingsSection
                icon="navigate-outline"
                title="採用哪一個"
                summary={activeSourceLabel}
              >
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
            </View>
          ) : (
            <View className="gap-2">
              <SectionLabel>聚合規則</SectionLabel>
              <SettingsSection
                icon="options-outline"
                title="如何合併"
                summary={getAggregationSummary(aggregationConfig)}
              >
                <AggregationContent
                  config={aggregationConfig}
                  setConfig={setAggregationConfig}
                  sourceCount={enabledSources.length}
                />
              </SettingsSection>
            </View>
          )}
        </View>
      </PageScrollView>
    </GlassBackground>
  );
}
