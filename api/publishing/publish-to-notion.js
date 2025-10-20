// Publish content to Notion via API
import { createClientFromRequest } from '@/lib/supabase';
import { z } from 'zod';

const NOTION_VERSION = '2022-06-28';

// Utility: Chunk long text for Notion's 2000-char limit per rich text block
function chunkRichText(text, chunkSize = 1800) {
  const blocks = [];
  let i = 0;
  while (i < text.length) {
    blocks.push({
      type: 'text',
      text: { content: text.slice(i, i + chunkSize) }
    });
    i += chunkSize;
  }
  return blocks.length ? blocks : [{ type: 'text', text: { content: '' } }];
}

// Utility: Extract plain text from HTML
function toPlain(html) {
  // Simple HTML stripping (server-side, no DOM parser needed)
  return html
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/\s+\n/g, '\n')
    .replace(/\n\s+/g, '\n')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// Utility: Check if URL is YouTube
function isYouTubeUrl(url) {
  try {
    const u = new URL(url);
    return /(^|\.)youtube\.com$/i.test(u.hostname) || /youtu\.be$/i.test(u.hostname);
  } catch {
    return false;
  }
}

// Utility: Convert YouTube URL to watch format
function toYouTubeWatchUrl(src) {
  try {
    const u = new URL(src);
    if (/youtu\.be$/i.test(u.hostname)) {
      const videoId = u.pathname.slice(1);
      return `https://www.youtube.com/watch?v=${videoId}`;
    }
    if (/(^|\.)youtube\.com$/i.test(u.hostname)) {
      const videoId = u.searchParams.get('v');
      if (videoId) return `https://www.youtube.com/watch?v=${videoId}`;
    }
    return src;
  } catch {
    return src;
  }
}

const requestSchema = z.object({
  credentialId: z.string().min(1, 'Credential ID is required'),
  title: z.string().min(1, 'Title is required'),
  html: z.string().min(1, 'HTML content is required'),
  databaseId: z.string().optional(),
  pageId: z.string().optional(),
  status: z.string().default('active'),
  tags: z.array(z.string()).default([]),
  excerpt: z.string().optional(),
  featured_image_url: z.string().url().optional(),
  author: z.string().optional()
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

    // Fetch credential from database
    const { data: credential, error: credError } = await supabase
      .from('credentials')
      .select('*')
      .eq('id', payload.credentialId)
      .eq('user_id', user.id)
      .single();

    if (credError || !credential) {
      console.error('[Notion] Credential not found:', credError?.message);
      return res.status(404).json({ error: 'Credential not found' });
    }

    const notionToken = credential.api_key || credential.access_token;
    if (!notionToken) {
      return res.status(400).json({ error: 'Notion token not found in credential' });
    }

    const databaseId = payload.databaseId || credential.metadata?.database_id;
    if (!databaseId) {
      return res.status(400).json({ error: 'Notion database ID is required' });
    }

    console.log('[Notion] Publishing to database:', databaseId);

    // Convert HTML to plain text for Notion (simple approach)
    const plainText = toPlain(payload.html);
    const contentBlocks = chunkRichText(plainText);

    // Build Notion page properties
    const properties = {
      title: {
        title: [{ type: 'text', text: { content: payload.title } }]
      }
    };

    if (payload.status) {
      properties.Status = { select: { name: payload.status } };
    }

    if (payload.tags && payload.tags.length > 0) {
      properties.Tags = { multi_select: payload.tags.map(tag => ({ name: tag })) };
    }

    if (payload.author) {
      properties.Author = { rich_text: [{ type: 'text', text: { content: payload.author } }] };
    }

    // Create Notion page
    const notionResponse = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${notionToken}`,
        'Notion-Version': NOTION_VERSION,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        parent: { database_id: databaseId },
        properties: properties,
        children: contentBlocks.map(block => ({
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [block]
          }
        }))
      })
    });

    if (!notionResponse.ok) {
      const errorText = await notionResponse.text();
      console.error('[Notion] API error:', notionResponse.status, errorText);
      return res.status(notionResponse.status).json({
        error: `Notion API error: ${notionResponse.status}`,
        details: errorText
      });
    }

    const notionData = await notionResponse.json();

    console.log('[Notion] Page created successfully:', notionData.id);

    return res.status(200).json({
      success: true,
      notion_page_id: notionData.id,
      notion_url: notionData.url,
      data: notionData
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors
      });
    }

    console.error('[Notion] Error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to publish to Notion'
    });
  }
}

