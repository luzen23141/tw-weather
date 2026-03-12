import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

const SITE_URL = 'https://weather.agubear.black';
const SITE_TITLE = '阿古熊天氣 — 台灣即時天氣預報與歷史查詢';
const SITE_DESCRIPTION =
  '提供全台灣 368 鄉鎮市區精準的即時天氣、逐時預報、7 日預報與歷史天氣查詢。整合 CWA 中央氣象署、Open-Meteo 等多方數據來源，支援聚合模式比較。';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="zh-Hant">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

        {/* SEO Basics */}
        <title>{SITE_TITLE}</title>
        <meta name="description" content={SITE_DESCRIPTION} />
        <meta
          name="keywords"
          content="台灣天氣, 天氣預報, 即時天氣, 逐時預報, 歷史天氣, 氣象, 阿古熊天氣, 中央氣象署, CWA, Open-Meteo, 鄉鎮天氣, weather Taiwan"
        />
        <meta name="author" content="阿古熊天氣" />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
        <link rel="canonical" href={SITE_URL} />

        {/* GEO */}
        <meta name="geo.region" content="TW" />
        <meta name="geo.placename" content="Taiwan" />
        <meta name="geo.position" content="23.5;121" />
        <meta name="ICBM" content="23.5, 121" />

        {/* Language */}
        <meta httpEquiv="content-language" content="zh-Hant-TW" />
        <link rel="alternate" hrefLang="zh-Hant-TW" href={SITE_URL} />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="阿古熊天氣" />
        <meta property="og:title" content={SITE_TITLE} />
        <meta property="og:description" content={SITE_DESCRIPTION} />
        <meta property="og:url" content={SITE_URL} />
        <meta property="og:image" content={`${SITE_URL}/og-image.png`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="阿古熊天氣 — 台灣天氣預報應用程式" />
        <meta property="og:locale" content="zh_TW" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={SITE_TITLE} />
        <meta name="twitter:description" content={SITE_DESCRIPTION} />
        <meta name="twitter:image" content={`${SITE_URL}/og-image.png`} />

        {/* PWA / Mobile */}
        <meta name="theme-color" content="#0891B2" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="阿古熊天氣" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

        {/* Font: Inter */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />

        {/* Schema.org JSON-LD — WebApplication */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: '阿古熊天氣',
              url: SITE_URL,
              description: SITE_DESCRIPTION,
              applicationCategory: 'WeatherApplication',
              operatingSystem: 'Web, iOS, Android',
              inLanguage: 'zh-Hant-TW',
              image: `${SITE_URL}/og-image.png`,
              screenshot: `${SITE_URL}/og-image.png`,
              author: {
                '@type': 'Organization',
                name: '阿古熊天氣',
                url: SITE_URL,
              },
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'TWD',
              },
              browserRequirements: 'Requires JavaScript. Modern browser recommended.',
              areaServed: {
                '@type': 'Country',
                name: 'Taiwan',
              },
              sameAs: ['https://github.com/luzen23141/tw-weather'],
            }),
          }}
        />

        {/* Schema.org JSON-LD — FAQPage (AEO) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: [
                {
                  '@type': 'Question',
                  name: '阿古熊天氣支援哪些天氣資料來源？',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: '阿古熊天氣整合 CWA 中央氣象署、Open-Meteo 與 WeatherAPI.com 三大資料來源，使用者可自由切換或啟用聚合模式比較。',
                  },
                },
                {
                  '@type': 'Question',
                  name: '阿古熊天氣涵蓋哪些地區？',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: '涵蓋全台灣 368 個鄉鎮市區，提供即時天氣、逐時預報、7 日預報與歷史天氣查詢。',
                  },
                },
                {
                  '@type': 'Question',
                  name: '阿古熊天氣是免費的嗎？',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: '是的，阿古熊天氣完全免費使用，支援 Web、iOS 與 Android 平台。',
                  },
                },
              ],
            }),
          }}
        />

        {/* Service Worker 離線快取 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js')})}`,
          }}
        />

        {/* Disable body scrolling on web */}
        <ScrollViewStyleReset />

        {/* Responsive reset */}
        <style
          dangerouslySetInnerHTML={{
            __html: `html, body { height: 100%; overflow: hidden; margin: 0; padding: 0; } #root { display: flex; flex-direction: column; height: 100%; }`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
