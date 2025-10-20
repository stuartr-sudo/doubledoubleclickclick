// Fetch Shopify blogs for credential testing/selection
import { createClientFromRequest } from '@/lib/supabase';
import { z } from 'zod';

const requestSchema = z.object({
  access_token: z.string().min(1, 'access_token is required'),
  store_domain: z.string().min(1, 'store_domain is required')
});

export default async function handler(req, res) {
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
    const supabase = createClientFromRequest(req, res);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const payload = requestSchema.parse(req.body);

    // Clean store domain
    const cleanDomain = payload.store_domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const shopifyUrl = `https://${cleanDomain}/admin/api/2024-01/blogs.json`;

    console.log('[Shopify Blogs] Fetching from:', shopifyUrl);

    const response = await fetch(shopifyUrl, {
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': payload.access_token,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Shopify Blogs] API error:', response.status, errorText);
      return res.status(response.status).json({
        success: false,
        error: `Shopify API error: ${response.statusText}`,
        details: errorText
      });
    }

    const data = await response.json();
    const blogs = data.blogs || [];

    // Return simplified blog list
    const blogList = blogs.map(blog => ({
      id: String(blog.id),
      title: blog.title,
      handle: blog.handle
    }));

    console.log('[Shopify Blogs] Found', blogList.length, 'blogs');

    return res.status(200).json({
      success: true,
      blogs: blogList
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors
      });
    }

    console.error('[Shopify Blogs] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch Shopify blogs'
    });
  }
}

