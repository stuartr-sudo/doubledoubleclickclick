// amazonProduct: Scrape Amazon product information
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { url } = req.body;

    // TODO: Implement actual Amazon scraping
    console.log('[amazonProduct] Stub called:', { url });

    return res.status(200).json({
      success: true,
      product: {
        name: 'Sample Product',
        url,
        price: '$0.00',
        image_url: '',
        description: 'Sample product description'
      }
    });

  } catch (error) {
    console.error('amazonProduct error:', error);
    return res.status(200).json({
      success: false,
      error: error.message
    });
  }
}

