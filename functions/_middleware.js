/**
 * Cloudflare Pages middleware to fix Cache-Control headers.
 *
 * Cloudflare Pages SPA fallback ignores `_headers` Cache-Control rules,
 * so HTML responses from fallback get the default `max-age=31536000`.
 * This middleware overrides that for non-static responses.
 */

const LONG_CACHE_PREFIXES = ['/_expo/static/', '/assets/'];

export async function onRequest(context) {
  const response = await context.next();
  const { pathname } = new URL(context.request.url);

  // Skip static assets — they should keep immutable long cache
  if (LONG_CACHE_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return response;
  }

  const cacheControl = response.headers.get('cache-control') || '';

  // Only fix responses that have the Pages default long cache
  if (cacheControl.includes('max-age=31536000')) {
    const newResponse = new Response(response.body, response);
    newResponse.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    return newResponse;
  }

  return response;
}
