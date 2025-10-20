// amazonProduct: Scrape product page using Firecrawl
import { z } from 'zod';

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;

const productSchema = z.object({
  url: z.string().url("Invalid URL format"),
});

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const parsed = productSchema.parse(req.body);
    const { url } = parsed;

    if (!FIRECRAWL_API_KEY) {
      console.error('FIRECRAWL_API_KEY not configured');
      return res.status(200).json({
        success: false,
        error: 'Firecrawl API key not configured'
      });
    }

    console.log('[amazonProduct] Scraping product:', url);

    // Call Firecrawl v2 /scrape endpoint
    const firecrawlResponse = await fetch('https://api.firecrawl.dev/v2/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: url,
        formats: ['markdown']
      })
    });

    const result = await firecrawlResponse.json();

    if (!firecrawlResponse.ok || !result.success) {
      console.error('Firecrawl /scrape error:', result);
      return res.status(200).json({
        success: false,
        error: result.error || 'Firecrawl scrape failed'
      });
    }

    // Extract content from Firecrawl v2 response
    const markdown = result.data?.markdown || '';
    const metadata = result.data?.metadata || {};
    const title = metadata.title || metadata.ogTitle || 'Untitled Product';
    const description = metadata.description || metadata.ogDescription || markdown.substring(0, 200);
    const imageUrl = metadata.ogImage || '';

    console.log('[amazonProduct] Scraped successfully:', { title, contentLength: markdown.length });

    return res.status(200).json({
      success: true,
      data: {
        product_title: title,
        product_description: description,
        about_product: markdown ? [markdown] : [],
        images: imageUrl ? [{ large: imageUrl }] : []
      }
    });

  } catch (error) {
    console.error('amazonProduct error:', error);
    return res.status(200).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}

