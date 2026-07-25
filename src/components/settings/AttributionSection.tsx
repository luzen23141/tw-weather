import React from 'react';
import { Linking, Pressable, Text, View } from 'react-native';

import { getPressFeedbackStyle } from '@/components/ui/press-feedback';

/**
 * 資料來源出處與授權標示。
 *
 * 這不是選擇性的裝飾，是**授權條款要求的義務**：
 *
 * - 中央氣象署開放資料採「政府資料開放授權條款第 1 版」，明定利用時應標示出處
 * - Open-Meteo 的資料採 CC BY 4.0，要求署名並提供授權條款連結
 *
 * 兩者都允許商業利用（含上架到 App Store），前提就是這段標示。少了它，
 * app 本身就處於違反授權的狀態 —— 這是上架前必須存在的東西，不是加分項。
 *
 * 授權連結必須可點：CC BY 4.0 的署名要求包含「提供授權條款的連結」，
 * 純文字寫出名稱並不滿足。
 */

interface AttributionEntry {
  /** 資料提供者全名，使用官方中文或英文名稱 */
  provider: string;
  /** 授權條款名稱 */
  license: string;
  /** 授權條款全文連結 */
  licenseUrl: string;
  /** 資料來源首頁 */
  homeUrl: string;
}

const ATTRIBUTIONS: AttributionEntry[] = [
  {
    provider: '交通部中央氣象署',
    license: '政府資料開放授權條款第 1 版',
    licenseUrl: 'https://data.gov.tw/license',
    homeUrl: 'https://opendata.cwa.gov.tw/',
  },
  {
    provider: 'Open-Meteo',
    license: 'CC BY 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    homeUrl: 'https://open-meteo.com/',
  },
];

function openUrl(url: string): void {
  void Linking.openURL(url).catch(() => {
    // 開不了外部瀏覽器不該讓設定頁崩潰；標示本身已經在畫面上了
    console.warn(`無法開啟連結: ${url}`);
  });
}

function LinkText({ label, url }: { label: string; url: string }): React.ReactElement {
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`開啟 ${label}`}
      onPress={() => {
        openUrl(url);
      }}
      hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
      style={(state) => getPressFeedbackStyle(state, { pressedOpacity: 0.7 })}
    >
      <Text className="text-[12px] leading-4 text-md-primary underline">{label}</Text>
    </Pressable>
  );
}

export function AttributionSection(): React.ReactElement {
  return (
    <View className="mx-4 gap-2">
      {ATTRIBUTIONS.map((entry, index) => (
        <View key={entry.provider}>
          <View className="gap-1 py-1.5">
            <LinkText label={entry.provider} url={entry.homeUrl} />
            <View className="flex-row flex-wrap items-center gap-1">
              <Text className="text-[12px] leading-4 text-md-on-surface-variant/78">資料採用</Text>
              <LinkText label={entry.license} url={entry.licenseUrl} />
            </View>
          </View>
          {index < ATTRIBUTIONS.length - 1 ? <View className="h-px bg-white/12" /> : null}
        </View>
      ))}

      {/* 中文換行需要比 leading-4 更寬的行距，否則兩行會擠在一起 */}
      <Text className="mt-1 text-[11px] leading-[17px] text-md-on-surface-variant/68">
        本應用程式非中央氣象署官方發布管道，資料僅供參考。防災決策請以官方發布為準。
      </Text>
    </View>
  );
}
