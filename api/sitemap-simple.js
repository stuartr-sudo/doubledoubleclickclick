export default function handler(req, res) {
  // Simple sitemap endpoint that works without authentication
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // For now, return a simple mock response to test if the endpoint works
    const mockPages = [
      { url: `${url}/`, title: 'Home' },
      { url: `${url}/about`, title: 'About' },
      { url: `${url}/contact`, title: 'Contact' },
      { url: `${url}/products`, title: 'Products' },
      { url: `${url}/services`, title: 'Services' },
      { url: `${url}/blog`, title: 'Blog' }
    ];

    res.status(200).json({
      success: true,
      pages: mockPages,
      total: mockPages.length,
      source: 'mock'
    });

  } catch (error) {
    console.error('Sitemap error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
