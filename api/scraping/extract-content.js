export default async function handler(req, res) {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { url, params = {} } = req.body;

    if (!url) {
      return res.status(400).json({ success: false, error: 'URL is required' });
    }

    const firecrawlApiKey = process.env.FIRECRAWL_API_KEY;
    if (!firecrawlApiKey) {
      return res.status(500).json({ success: false, error: 'Firecrawl API key not configured' });
    }

    // Try Firecrawl first
    try {
      const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firecrawlApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: url,
          formats: ['markdown', 'html'],
          onlyMainContent: true,
          ...params
        })
      });

      if (response.ok) {
        const data = await response.json();
        return res.status(200).json({
          success: true,
          data: data
        });
      }
    } catch (firecrawlError) {
      console.warn('Firecrawl failed, trying fallback:', firecrawlError.message);
    }

    // Fallback: Simple fetch
    const fallbackResponse = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!fallbackResponse.ok) {
      throw new Error(`Failed to fetch URL: ${fallbackResponse.status}`);
    }

    const html = await fallbackResponse.text();
    
    return res.status(200).json({
      success: true,
      data: {
        html: html,
        markdown: html // Basic fallback
      }
    });

  } catch (error) {
    console.error('Extract content error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Internal server error' 
    });
  }
}