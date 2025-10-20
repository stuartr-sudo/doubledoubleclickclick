// getSitemapPages: Fetch sitemap URLs using Firecrawl /map endpoint
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { url, limit = 200 } = req.body;

    if (!url) {
      return res.status(200).json({
        success: false,
        error: 'Missing required parameter: url'
      });
    }

    if (!FIRECRAWL_API_KEY) {
      return res.status(200).json({
        success: false,
        error: 'Firecrawl API key not configured'
      });
    }

    // Normalize URL
    let normalizedUrl = url.trim();
    if (!normalizedUrl.match(/^https?:\/\//i)) {
      normalizedUrl = 'https://' + normalizedUrl;
    }

    const urlObj = new URL(normalizedUrl);
    const base = urlObj.hostname.replace(/^www\./i, '');

    // Call Firecrawl /map endpoint
    const firecrawlResponse = await fetch('https://api.firecrawl.dev/v1/map', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: normalizedUrl,
        limit: limit,
        includeSubdomains: false,
        search: null
      })
    });

    const data = await firecrawlResponse.json();

    if (!firecrawlResponse.ok) {
      console.error('Firecrawl /map error:', data);
      return res.status(200).json({
        success: false,
        error: data.error || 'Firecrawl API error',
        firecrawl_status: firecrawlResponse.status
      });
    }

    // Extract URLs from Firecrawl response
    // Firecrawl /map returns { links: [...] }
    const links = data.links || [];

    // Transform to our format: { url, title }
    const pages = links.map((link) => {
      if (typeof link === 'string') {
        return { url: link, title: link };
      }
      return {
        url: link.url || link,
        title: link.title || link.url || link
      };
    });

    return res.status(200).json({
      success: true,
      base,
      total: pages.length,
      pages: pages.slice(0, limit)
    });

  } catch (error) {
    console.error('getSitemapPages error:', error);
    return res.status(200).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}

