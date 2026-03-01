import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  const cwaKey = process.env['CWA_API_KEY'] ?? 'NOT_SET';
  const waKey = process.env['WEATHERAPI_KEY'] ?? 'NOT_SET';

  // 測試用 CWA URL
  const testUrl = `https://opendata.cwa.gov.tw/api/v1/rest/datastore/O-A0001-001?Authorization=${cwaKey}&format=JSON&limit=1`;

  let cwaTest = '';
  try {
    const resp = await fetch(testUrl);
    cwaTest = `HTTP ${resp.status}`;
    if (resp.ok) {
      const text = await resp.text();
      cwaTest += ` | body length: ${text.length}`;
    }
  } catch (e) {
    cwaTest = `fetch error: ${String(e)}`;
  }

  res.status(200).json({
    cwaKeyPrefix: cwaKey.substring(0, 10),
    waKeyPrefix: waKey.substring(0, 8),
    cwaTest,
    query: req.query,
  });
}
