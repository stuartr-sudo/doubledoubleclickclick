// Publish blog posts to Shopify via Admin API
import { createClientFromRequest } from '@/lib/supabase';
import { z } from 'zod';

const requestSchema = z.object({
  credentialId: z.string().min(1, 'Credential ID is required'),
  title: z.string().min(1, 'Title is required'),
  html: z.string().min(1, 'HTML content is required'),
  status: z.enum(['active', 'draft', 'hidden']).default('active'),
  excerpt: z.string().optional(),
  slug: z.string().optional(),
  tags: z.array(z.string()).default([]),
  meta_description: z.string().optional(),
  meta_title: z.string().optional(),
  focus_keyword: z.string().optional(),
  export_seo_as_tags: z.boolean().default(false),
  featured_image_url: z.string().url().optional(),
  author: z.string().optional(),
  generated_llm_schema: z.any().optional(),
  blog_id: z.string().optional()
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

    console.log('[Shopify] Publishing post:', {
      title: payload.title.substring(0, 50),
      titleLength: payload.title.length,
      status: payload.status,
      credentialId: payload.credentialId
    });

    // Fetch credential from database
    const { data: credential, error: credError } = await supabase
      .from('credentials')
      .select('*')
      .eq('id', payload.credentialId)
      .eq('user_id', user.id)
      .single();

    if (credError || !credential) {
      console.error('[Shopify] Credential not found:', credError?.message);
      return res.status(404).json({ error: 'Shopify credential not found' });
    }

    const shopifyShopUrl = credential.shop_url || credential.metadata?.shop_url;
    const shopifyAccessToken = credential.access_token || credential.api_key;

    if (!shopifyShopUrl || !shopifyAccessToken) {
      return res.status(400).json({ error: 'Shopify shop URL and access token are required' });
    }

    // Build tags array (combine regular tags + SEO keywords if enabled)
    let finalTags = [...payload.tags];
    if (payload.export_seo_as_tags && payload.focus_keyword) {
      finalTags.push(payload.focus_keyword);
    }

    // Build Shopify blog article payload
    const articlePayload = {
      article: {
        title: payload.title,
        body_html: payload.html,
        published: payload.status === 'active',
        tags: finalTags.join(', '),
        author: payload.author || 'Admin'
      }
    };

    // Add optional fields
    if (payload.excerpt) {
      articlePayload.article.summary_html = payload.excerpt;
    }

    if (payload.slug) {
      articlePayload.article.handle = payload.slug;
    }

    if (payload.meta_title || payload.meta_description) {
      articlePayload.article.metafields = [];
      
      if (payload.meta_title) {
        articlePayload.article.metafields.push({
          namespace: 'global',
          key: 'title_tag',
          value: payload.meta_title,
          type: 'single_line_text_field'
        });
      }

      if (payload.meta_description) {
        articlePayload.article.metafields.push({
          namespace: 'global',
          key: 'description_tag',
          value: payload.meta_description,
          type: 'single_line_text_field'
        });
      }
    }

    if (payload.featured_image_url) {
      articlePayload.article.image = {
        src: payload.featured_image_url
      };
    }

    // Determine blog ID
    const blogId = payload.blog_id || credential.metadata?.blog_id || 'news'; // Default to 'news' blog

    // Construct Shopify API URL
    const shopifyApiUrl = `https://${shopifyShopUrl}/admin/api/2024-01/blogs/${blogId}/articles.json`;

    console.log('[Shopify] Calling API:', shopifyApiUrl);

    // Call Shopify API
    const shopifyResponse = await fetch(shopifyApiUrl, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': shopifyAccessToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(articlePayload)
    });

    if (!shopifyResponse.ok) {
      const errorText = await shopifyResponse.text();
      console.error('[Shopify] API error:', shopifyResponse.status, errorText);
      return res.status(shopifyResponse.status).json({
        error: `Shopify API error: ${shopifyResponse.status}`,
        details: errorText
      });
    }

    const shopifyData = await shopifyResponse.json();

    console.log('[Shopify] Article created successfully:', shopifyData.article?.id);

    return res.status(200).json({
      success: true,
      shopify_article_id: shopifyData.article?.id,
      shopify_url: `https://${shopifyShopUrl}/blogs/${blogId}/${shopifyData.article?.handle}`,
      data: shopifyData.article
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors
      });
    }

    console.error('[Shopify] Error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to publish to Shopify'
    });
  }
}

