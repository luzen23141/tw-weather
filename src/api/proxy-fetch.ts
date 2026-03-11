const PROXY_SECRET = process.env.EXPO_PUBLIC_PROXY_SECRET;

async function signRequest(timestamp: string, path: string): Promise<Record<string, string>> {
  if (!PROXY_SECRET) return {};

  const message = `${timestamp}\nGET\n${path}`;
  const encoder = new TextEncoder();

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(PROXY_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  const hexSig = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return {
    'X-Timestamp': timestamp,
    'X-Signature': hexSig,
  };
}

export async function proxyFetch(url: string): Promise<Response> {
  const urlObj = new URL(url);
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const authHeaders = await signRequest(timestamp, urlObj.pathname);
  return fetch(url, { headers: authHeaders });
}
