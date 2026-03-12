// tw-weather Service Worker — 離線快取策略
const CACHE_VERSION = 'v1';
const STATIC_CACHE = `tw-weather-static-${CACHE_VERSION}`;
const HTML_CACHE = `tw-weather-html-${CACHE_VERSION}`;

// 需要預快取的 HTML shell
const PRECACHE_URLS = ['/'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(HTML_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== STATIC_CACHE && key !== HTML_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // 只處理 GET 請求
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // 跳過 API 請求（天氣資料應即時取得）
  if (url.pathname.startsWith('/api/')) return;

  // 跳過 chrome-extension 等非 http(s) 請求
  if (!url.protocol.startsWith('http')) return;

  // 靜態資源（帶 hash 的 JS/CSS/圖片）— Stale-While-Revalidate
  // 這些檔案名稱含 content hash，內容不變，可長期快取
  if (
    url.pathname.startsWith('/_expo/static/') ||
    url.pathname.startsWith('/assets/')
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
            }
            return response;
          }),
      ),
    );
    return;
  }

  // HTML 導航請求 — Network-first, fallback to cache
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(HTML_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('/'))),
    );
    return;
  }

  // 其他資源（字型等）— Cache-first
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        }),
    ),
  );
});
