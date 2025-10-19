// Firecrawl Map API endpoint - gets all URLs from a website
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
    const { url, limit = 200 } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    console.log('Getting sitemap for:', url);

    // Use Firecrawl Map API to get all URLs from the website
    const firecrawlApiKey = process.env.FIRECRAWL_API_KEY;
    
    if (!firecrawlApiKey) {
      console.error('FIRECRAWL_API_KEY not found');
      return res.status(500).json({ error: 'Firecrawl API key not configured' });
    }

    // Call Firecrawl Map API
    fetch('https://api.firecrawl.dev/v2/map', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${firecrawlApiKey}`
      },
      body: JSON.stringify({
        url: url,
        limit: limit || 200,
        sitemap: 'include' // Include sitemap for better coverage
      })
    })
    .then(response => response.json())
    .then(data => {
      console.log('Firecrawl Map API response:', data);
      
      if (data.success && data.links && Array.isArray(data.links)) {
        // Transform Firecrawl response to match expected format
        const pages = data.links.map(link => ({
          url: link.url,
          title: link.title || extractTitleFromUrl(link.url)
        }));

        res.status(200).json({
          success: true,
          pages: pages,
          total: pages.length,
          source: 'firecrawl'
        });
      } else {
        console.error('Firecrawl API returned unexpected format:', data);
        
        // Fallback to basic pages if Firecrawl fails
        const domain = url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
        const fallbackPages = [
          { url: `https://${domain}/`, title: 'Home' },
          { url: `https://${domain}/about`, title: 'About Us' },
          { url: `https://${domain}/contact`, title: 'Contact' },
          { url: `https://${domain}/blog`, title: 'Blog' },
          { url: `https://${domain}/products`, title: 'Products' },
          { url: `https://${domain}/services`, title: 'Services' }
        ];

        res.status(200).json({
          success: true,
          pages: fallbackPages,
          total: fallbackPages.length,
          source: 'fallback'
        });
      }
    })
    .catch(error => {
      console.error('Firecrawl Map API error:', error);
      
      // Fallback to basic pages if API fails
      const domain = url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
      const fallbackPages = [
        { url: `https://${domain}/`, title: 'Home' },
        { url: `https://${domain}/about`, title: 'About Us' },
        { url: `https://${domain}/contact`, title: 'Contact' },
        { url: `https://${domain}/blog`, title: 'Blog' },
        { url: `https://${domain}/products`, title: 'Products' },
        { url: `https://${domain}/services`, title: 'Services' }
      ];

      res.status(200).json({
        success: true,
        pages: fallbackPages,
        total: fallbackPages.length,
        source: 'fallback',
        error: error.message
      });
    });

  } catch (error) {
    console.error('getSitemapPages error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Helper function to extract title from URL
function extractTitleFromUrl(url) {
  try {
    const urlObj = new URL(url);
    let path = urlObj.pathname;
    
    // Remove trailing slashes
    path = path.replace(/\/+$/, '');
    
    // If homepage, use domain
    if (!path || path === '/') {
      return urlObj.hostname.replace(/^www\./i, '');
    }
    
    // Get last segment of path
    const segments = path.split('/').filter(Boolean);
    const lastSegment = segments[segments.length - 1];
    
    // Clean up the title
    return lastSegment
      .replace(/[-_]+/g, ' ')
      .replace(/\.[a-z0-9]+$/i, '')
      .replace(/\b\w/g, (match) => match.toUpperCase());
  } catch {
    return 'Page';
  }
}