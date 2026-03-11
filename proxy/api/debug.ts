import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, OPTIONS');
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  res.status(200).json({
    ok: true,
    service: 'weather-proxy',
    timestamp: new Date().toISOString(),
  });
}
