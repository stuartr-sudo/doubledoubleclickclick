import { createClient } from '@supabase/supabase-js';
import { validateRequest } from '../utils/validation.js';
import { createResponse } from '../utils/response.js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase configuration');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  try {
    const { method } = req;
    const { action } = req.query;

    // Validate request
    const validation = await validateRequest(req, {
      requiredAuth: true,
      allowedMethods: ['POST']
    });

    if (!validation.success) {
      return createResponse(res, validation.error, 401);
    }

    const { user } = validation;

    // Route to appropriate handler based on action
    switch (action) {
      case 'publish':
        return await handlePublish(req, res, user);
      case 'wordpress':
        return await handleWordPressPublish(req, res, user);
      case 'shopify':
        return await handleShopifyPublish(req, res, user);
      case 'airtable':
        return await handleAirtablePublish(req, res, user);
      default:
        return createResponse(res, { error: 'Invalid action' }, 400);
    }
  } catch (error) {
    console.error('Publishing API error:', error);
    return createResponse(res, { error: 'Internal server error' }, 500);
  }
}

async function handlePublish(req, res, user) {
  try {
    const { 
      provider, 
      credentialId, 
      title, 
      content, 
      content_html, 
      text, 
      status = 'publish' 
    } = req.body;

    if (!provider || !credentialId || !title || !content) {
      return createResponse(res, { error: 'Missing required fields' }, 400);
    }

    // Get user's credentials for the provider
    const { data: credentials } = await supabase
      .from('integration_credentials')
      .select('*')
      .eq('user_id', user.id)
      .eq('integration_type', provider)
      .eq('id', credentialId)
      .single();

    if (!credentials) {
      return createResponse(res, { error: 'Credentials not found' }, 404);
    }

    let result;

    switch (provider) {
      case 'wordpress':
      case 'wordpress_org':
        result = await publishToWordPress(credentials, { title, content, content_html, text, status });
        break;
      case 'shopify':
        result = await publishToShopify(credentials, { title, content, content_html, text, status });
        break;
      default:
        return createResponse(res, { error: 'Unsupported provider' }, 400);
    }

    // Log the publish action
    await supabase
      .from('wordpress_publish_logs')
      .insert({
        post_id: null, // Will be updated if we have a blog post ID
        wordpress_id: result.id || result.post_id,
        status: result.success ? 'published' : 'failed',
        error_message: result.error || null,
        user_name: user.email
      });

    return createResponse(res, result);

  } catch (error) {
    console.error('Publish error:', error);
    return createResponse(res, { error: 'Failed to publish content' }, 500);
  }
}

async function publishToWordPress(credentials, { title, content, content_html, text, status }) {
  try {
    const wpCredentials = credentials.credential_data;
    const wpUrl = wpCredentials.wordpress_url;
    const username = wpCredentials.username;
    const password = wpCredentials.password;

    if (!wpUrl || !username || !password) {
      throw new Error('WordPress credentials incomplete');
    }

    // Use WordPress REST API to create post
    const response = await fetch(`${wpUrl}/wp-json/wp/v2/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`
      },
      body: JSON.stringify({
        title: title,
        content: content_html || content,
        excerpt: text ? text.substring(0, 160) : '',
        status: status,
        format: 'standard'
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`WordPress API error: ${errorData}`);
    }

    const data = await response.json();
    
    return {
      success: true,
      id: data.id,
      post_id: data.id,
      url: data.link,
      message: 'Published to WordPress successfully'
    };

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function publishToShopify(credentials, { title, content, content_html, text, status }) {
  try {
    const shopifyCredentials = credentials.credential_data;
    const shopDomain = shopifyCredentials.shop_domain;
    const accessToken = shopifyCredentials.access_token;

    if (!shopDomain || !accessToken) {
      throw new Error('Shopify credentials incomplete');
    }

    // Create a blog post in Shopify
    const response = await fetch(`https://${shopDomain}.myshopify.com/admin/api/2023-10/blog_posts.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken
      },
      body: JSON.stringify({
        blog_post: {
          title: title,
          body_html: content_html || content,
          summary: text ? text.substring(0, 160) : '',
          published: status === 'publish'
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Shopify API error: ${errorData}`);
    }

    const data = await response.json();
    
    return {
      success: true,
      id: data.blog_post.id,
      post_id: data.blog_post.id,
      url: data.blog_post.url,
      message: 'Published to Shopify successfully'
    };

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function handleAirtablePublish(req, res, user) {
  try {
    const { tableId, recordId, title, content, fields } = req.body;

    if (!tableId || !recordId || !title || !content) {
      return createResponse(res, { error: 'Missing required fields' }, 400);
    }

    // Get user's Airtable credentials
    const { data: credentials } = await supabase
      .from('integration_credentials')
      .select('*')
      .eq('user_id', user.id)
      .eq('integration_type', 'airtable')
      .single();

    if (!credentials) {
      return createResponse(res, { error: 'Airtable credentials not found' }, 404);
    }

    const airtableApiKey = credentials.credential_data.airtable_api_key;
    const airtableBaseId = credentials.credential_data.airtable_base_id || tableId;

    if (!airtableApiKey || !airtableBaseId) {
      return createResponse(res, { error: 'Airtable API key or Base ID not configured' }, 400);
    }

    // Update the Airtable record
    const response = await fetch(`https://api.airtable.com/v0/${airtableBaseId}/${tableId}/${recordId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${airtableApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fields: {
          Title: title,
          Content: content,
          ...fields // Additional fields if provided
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Airtable API error:', errorData);
      return createResponse(res, { error: 'Failed to update Airtable record' }, 500);
    }

    const data = await response.json();

    // Log the publish action
    await supabase
      .from('webhook_received')
      .insert({
        user_name: user.email,
        title: `Published to Airtable: ${title}`,
        content: content,
        status: 'published',
        webhook_data: {
          tableId,
          recordId,
          action: 'publish'
        }
      });

    return createResponse(res, data);

  } catch (error) {
    console.error('Airtable publish error:', error);
    return createResponse(res, { error: 'Failed to publish to Airtable' }, 500);
  }
}

async function handleWordPressPublish(req, res, user) {
  return await handlePublish(req, res, user);
}

async function handleShopifyPublish(req, res, user) {
  return await handlePublish(req, res, user);
}
