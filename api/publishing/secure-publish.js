// Generic secure publishing endpoint supporting multiple CMS providers
import { createClientFromRequest } from '@/lib/supabase';
import { z } from 'zod';

const requestSchema = z.object({
  provider: z.enum(['shopify', 'wordpress_org', 'wordpress_com', 'ghost', 'medium']),
  credentialId: z.string().min(1, 'Credential ID is required'),
  title: z.string().min(1, 'Title is required'),
  html: z.string().min(1, 'HTML content is required'),
  text: z.string().optional(),
  page_builder: z.string().optional(),
  status: z.enum(['publish', 'draft', 'private', 'active', 'hidden']).default('draft'),
  excerpt: z.string().optional(),
  slug: z.string().optional(),
  tags: z.array(z.string()).default([]),
  categories: z.array(z.string()).default([]),
  featured_image_url: z.string().url().optional(),
  author: z.string().optional(),
  meta_description: z.string().optional(),
  meta_title: z.string().optional()
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

    console.log('[Secure Publish] Publishing to:', {
      provider: payload.provider,
      credentialId: payload.credentialId,
      titleLength: payload.title.length
    });

    // Fetch credential
    const { data: credential, error: credError } = await supabase
      .from('credentials')
      .select('*')
      .eq('id', payload.credentialId)
      .eq('user_id', user.id)
      .single();

    if (credError || !credential) {
      console.error('[Secure Publish] Credential not found:', credError?.message);
      return res.status(404).json({ error: 'Credential not found' });
    }

    // Route to appropriate publisher
    if (payload.provider === 'shopify') {
      return await publishToShopify(credential, payload, res);
    } else if (payload.provider === 'wordpress_org') {
      return await publishToWordPressOrg(credential, payload, res);
    } else if (payload.provider === 'wordpress_com') {
      return await publishToWordPressCom(credential, payload, res);
    } else if (payload.provider === 'ghost') {
      return await publishToGhost(credential, payload, res);
    } else if (payload.provider === 'medium') {
      return await publishToMedium(credential, payload, res);
    }

    return res.status(400).json({ error: 'Unsupported provider' });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors
      });
    }

    console.error('[Secure Publish] Error:', error);
    return res.status(500).json({
      error: error.message || 'Publishing failed'
    });
  }
}

async function publishToShopify(credential, payload, res) {
  const { access_token, site_domain, metadata } = credential;
  const blog_id = metadata?.blog_id || 'news';

  if (!access_token || !site_domain) {
    return res.status(400).json({ error: 'Shopify credential missing access_token or site_domain' });
  }

  const cleanDomain = site_domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const shopifyUrl = `https://${cleanDomain}/admin/api/2024-01/blogs/${blog_id}/articles.json`;

  const articlePayload = {
    article: {
      title: payload.title,
      body_html: payload.html,
      published: payload.status === 'publish' || payload.status === 'active',
      tags: payload.tags.join(', ')
    }
  };

  if (payload.excerpt) articlePayload.article.summary_html = payload.excerpt;
  if (payload.slug) articlePayload.article.handle = payload.slug;
  if (payload.author) articlePayload.article.author = payload.author;
  if (payload.featured_image_url) articlePayload.article.image = { src: payload.featured_image_url };

  const response = await fetch(shopifyUrl, {
    method: 'POST',
    headers: {
      'X-Shopify-Access-Token': access_token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(articlePayload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Shopify] Publish error:', response.status, errorText);
    return res.status(response.status).json({
      error: `Shopify publish failed: ${response.statusText}`,
      details: errorText
    });
  }

  const data = await response.json();
  return res.status(200).json({
    success: true,
    article_id: data.article?.id,
    url: `https://${cleanDomain}/blogs/${blog_id}/${data.article?.handle}`
  });
}

async function publishToWordPressOrg(credential, payload, res) {
  const { site_domain, username, password, api_key } = credential;

  if (!site_domain) {
    return res.status(400).json({ error: 'WordPress credential missing site_domain' });
  }

  // Support both Basic Auth and Application Password
  const auth = api_key 
    ? `Bearer ${api_key}`
    : `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;

  const cleanDomain = site_domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const wpUrl = `https://${cleanDomain}/wp-json/wp/v2/posts`;

  const postPayload = {
    title: payload.title,
    content: payload.html,
    status: payload.status === 'publish' ? 'publish' : 'draft',
    excerpt: payload.excerpt || '',
    slug: payload.slug,
    tags: payload.tags,
    categories: payload.categories,
    meta: {}
  };

  if (payload.meta_title) postPayload.meta.title = payload.meta_title;
  if (payload.meta_description) postPayload.meta.description = payload.meta_description;

  const response = await fetch(wpUrl, {
    method: 'POST',
    headers: {
      'Authorization': auth,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(postPayload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[WordPress.org] Publish error:', response.status, errorText);
    return res.status(response.status).json({
      error: `WordPress publish failed: ${response.statusText}`,
      details: errorText
    });
  }

  const data = await response.json();
  return res.status(200).json({
    success: true,
    post_id: data.id,
    url: data.link
  });
}

async function publishToWordPressCom(credential, payload, res) {
  const { access_token, site_id } = credential;

  if (!access_token || !site_id) {
    return res.status(400).json({ error: 'WordPress.com credential missing access_token or site_id' });
  }

  const wpComUrl = `https://public-api.wordpress.com/rest/v1.1/sites/${site_id}/posts/new`;

  const postPayload = {
    title: payload.title,
    content: payload.html,
    status: payload.status,
    excerpt: payload.excerpt,
    slug: payload.slug,
    tags: payload.tags.join(','),
    categories: payload.categories.join(',')
  };

  const response = await fetch(wpComUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(postPayload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[WordPress.com] Publish error:', response.status, errorText);
    return res.status(response.status).json({
      error: `WordPress.com publish failed: ${response.statusText}`,
      details: errorText
    });
  }

  const data = await response.json();
  return res.status(200).json({
    success: true,
    post_id: data.ID,
    url: data.URL
  });
}

async function publishToGhost(credential, payload, res) {
  // Ghost Admin API implementation placeholder
  return res.status(501).json({ error: 'Ghost publishing not yet implemented' });
}

async function publishToMedium(credential, payload, res) {
  // Medium API implementation placeholder
  return res.status(501).json({ error: 'Medium publishing not yet implemented' });
}

