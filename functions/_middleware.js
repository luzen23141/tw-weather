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

  // Always override cache-control for non-static paths (HTML, manifest, sw, etc.)
  // Pages platform sets max-age=31536000 on SPA fallback responses AFTER _headers,
  // so we must force it here unconditionally for non-static paths
  const newResponse = new Response(response.body, response);
  newResponse.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  newResponse.headers.set('X-Cache-Override', 'middleware');
  return newResponse;
}
