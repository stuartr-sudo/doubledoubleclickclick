import { z } from 'zod';

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;

const schema = z.object({
  url: z.string().url('Invalid URL'),
  maxAge: z.number().optional()
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { url, maxAge } = schema.parse(req.body);
    if (!FIRECRAWL_API_KEY) return res.status(200).json({ success: false, error: 'Missing FIRECRAWL_API_KEY' });

    const fc = await fetch('https://api.firecrawl.dev/v2/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url, formats: ['markdown', 'html'], ...(maxAge !== undefined ? { maxAge } : {}) })
    });
    const result = await fc.json();
    if (!fc.ok || !result.success) {
      return res.status(200).json({ success: false, error: result.error || 'Firecrawl error' });
    }

    const markdown = result.data?.markdown || '';
    const title = result.data?.metadata?.title || 'Untitled';

    return res.status(200).json({ success: true, text: markdown, title });
  } catch (e) {
    return res.status(200).json({ success: false, error: e.message });
  }
}


