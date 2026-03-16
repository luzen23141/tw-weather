import process from 'node:process';

const DEFAULT_PAGES_URL = 'https://tw-weather.pages.dev';
const DEFAULT_CUSTOM_URL = 'https://weather.agubear.black';
const DEFAULT_SITEMAP_URL = `${DEFAULT_CUSTOM_URL}/sitemap.xml`;
const MAX_RETRIES = 20;

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function fetchText(url, timeout = 10_000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      headers: {
        'cache-control': 'no-cache',
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.text();
  } finally {
    clearTimeout(timer);
  }
}

function extractEntryPath(html) {
  const match = html.match(/\/_expo\/static\/js\/web\/entry-[a-f0-9]+\.js/);
  return match?.[0] ?? null;
}

async function readEntryPath(baseUrl, useCacheBusting) {
  const suffix = useCacheBusting ? `?v=${Date.now()}` : '';
  const html = await fetchText(`${baseUrl}/${suffix}`);
  return extractEntryPath(html);
}

async function verifyDeployment() {
  console.log('\nStarting deployment verification\n');

  const expectedEntry = await readEntryPath(DEFAULT_PAGES_URL, true);
  if (!expectedEntry) {
    throw new Error(`Unable to read entry bundle from ${DEFAULT_PAGES_URL}`);
  }

  console.log(`Pages bundle:  ${expectedEntry}`);

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const customEntry = await readEntryPath(DEFAULT_CUSTOM_URL, true);

      if (customEntry === expectedEntry) {
        console.log(`Custom bundle: ${customEntry}`);
        console.log(`Matched on attempt ${attempt}/${MAX_RETRIES}`);
        return;
      }

      console.log(
        `Attempt ${attempt}/${MAX_RETRIES}: custom domain still serves ${customEntry ?? 'unknown bundle'}`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`Attempt ${attempt}/${MAX_RETRIES}: custom domain fetch failed (${message})`);
    }

    if (attempt < MAX_RETRIES) {
      const delay = Math.min(5000 + attempt * 2000, 30_000);
      await sleep(delay);
    }
  }

  throw new Error('Custom domain did not update to the latest Pages bundle in time');
}

async function warmUpCache() {
  try {
    const sitemap = await fetchText(`${DEFAULT_SITEMAP_URL}?v=${Date.now()}`);
    const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)]
      .map((match) => match[1])
      .filter((url) => typeof url === 'string');

    if (urls.length === 0) {
      return;
    }

    console.log(`Warming ${urls.length} sitemap URLs`);

    for (const url of urls) {
      try {
        const separator = url.includes('?') ? '&' : '?';
        await fetchText(`${url}${separator}v=${Date.now()}`);
      } catch {
        // Ignore warm-up failures; verification already proved deployment state.
      }
    }
  } catch {
    // Ignore sitemap fetch failures.
  }
}

async function verifyCacheHeaders() {
  console.log('\nChecking cache headers on custom domain\n');

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000);
    const response = await fetch(`${DEFAULT_CUSTOM_URL}/?v=${Date.now()}`, {
      method: 'HEAD',
      signal: controller.signal,
    });
    clearTimeout(timer);

    const cacheControl = response.headers.get('cache-control') ?? '';
    const cdnCacheControl = response.headers.get('cdn-cache-control') ?? '';

    console.log(`  cache-control:     ${cacheControl}`);
    console.log(`  cdn-cache-control: ${cdnCacheControl}`);

    if (cacheControl.includes('max-age=31536000')) {
      console.warn(
        '\n⚠  WARNING: Root path still has max-age=31536000 — CDN may not have propagated yet',
      );
    } else if (cacheControl.includes('no-cache') || cacheControl.includes('no-store')) {
      console.log('  ✓ Cache headers are correct');
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`\n⚠  Cache header check failed: ${message}`);
  }
}

await verifyDeployment();
await verifyCacheHeaders();
await warmUpCache();

console.log('\nDeployment verified\n');
process.exit(0);
