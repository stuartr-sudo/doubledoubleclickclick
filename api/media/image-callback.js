// Receive generated images from external services and save to image library
// Supports multiple input formats: GET, POST JSON, text/plain, form-urlencoded, multipart
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const URL_REGEX = /(https?:\/\/[^\s"']+)/i;
const isUrl = (s) => typeof s === 'string' && URL_REGEX.test(s);

// Extract URL from any nested object structure
function findUrlAnywhere(obj) {
  if (!obj) return '';
  if (typeof obj === 'string') return isUrl(obj) ? obj.trim() : '';
  if (typeof obj !== 'object') return '';
  
  const candidates = [
    obj.value, obj.url, obj.image_url, obj.imageUrl, obj.href,
    obj.result, obj.output, obj.text, obj.string, obj.data,
    obj.result?.url, obj.data?.url, obj.output?.url, obj.output_url
  ].filter(Boolean);
  
  for (const c of candidates) {
    if (typeof c === 'string' && isUrl(c)) return c.trim();
    if (Array.isArray(c)) {
      const hit = c.find(x => typeof x === 'string' && isUrl(x));
      if (hit) return hit.trim();
    }
  }
  
  // Recursively search nested objects
  try {
    for (const k of Object.keys(obj)) {
      const v = obj[k];
      if (v && typeof v === 'object') {
        const found = findUrlAnywhere(v);
        if (found) return found;
      }
    }
  } catch {}
  
  return '';
}

function normalizeTags(tags) {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags.filter(Boolean);
  if (typeof tags === 'string') {
    try {
      const parsed = JSON.parse(tags);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
    } catch {}
    return tags.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Callback-Token');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Optional token-based auth for external webhooks
    const expectedToken = process.env.IMAGE_CALLBACK_TOKEN;
    if (expectedToken) {
      const urlObj = new URL(`http://localhost${req.url}`);
      const receivedToken = 
        urlObj.searchParams.get('token') ||
        req.headers['x-callback-token'] ||
        (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
      
      if (receivedToken !== expectedToken) {
        return res.status(401).json({ 
          success: false, 
          error: 'Unauthorized: invalid or missing callback token' 
        });
      }
    }

    const method = req.method || 'GET';
    const contentType = (req.headers['content-type'] || '').toLowerCase();

    let url = '';
    let user_name = '';
    let alt_text = 'AI generated image';
    let tags = [];
    let source = 'ai_generated';

    // Parse input based on method and content-type
    if (method === 'GET') {
      const urlObj = new URL(`http://localhost${req.url}`);
      const rawData = urlObj.searchParams.get('data');
      
      if (rawData) {
        try { 
          const parsed = JSON.parse(rawData);
          url = findUrlAnywhere(parsed) || parsed.url || parsed.image_url || '';
        } catch { 
          url = rawData;
        }
      }
      
      url = url || urlObj.searchParams.get('url') || urlObj.searchParams.get('value') || urlObj.searchParams.get('image_url') || '';
      user_name = urlObj.searchParams.get('user_name') || urlObj.searchParams.get('username') || '';
      alt_text = urlObj.searchParams.get('alt_text') || alt_text;
      source = urlObj.searchParams.get('source') || source;
      tags = normalizeTags(urlObj.searchParams.get('tags'));
      
    } else if (method === 'POST') {
      if (contentType.includes('application/json')) {
        const bodyText = await new Promise((resolve) => {
          let body = '';
          req.on('data', chunk => body += chunk);
          req.on('end', () => resolve(body));
        });
        
        try {
          const parsed = JSON.parse(bodyText);
          url = findUrlAnywhere(parsed);
          user_name = parsed.user_name || parsed.username || parsed.userName || '';
          alt_text = parsed.alt_text || parsed.altText || alt_text;
          source = parsed.source || source;
          tags = normalizeTags(parsed.tags);
        } catch {
          // If JSON parsing fails, try as plain URL
          url = bodyText.trim().replace(/^"+|"+$/g, '');
        }
        
      } else if (contentType.includes('text/plain')) {
        const bodyText = await new Promise((resolve) => {
          let body = '';
          req.on('data', chunk => body += chunk);
          req.on('end', () => resolve(body));
        });
        url = bodyText.trim().replace(/^"+|"+$/g, '');
        
      } else if (contentType.includes('application/x-www-form-urlencoded')) {
        const bodyText = await new Promise((resolve) => {
          let body = '';
          req.on('data', chunk => body += chunk);
          req.on('end', () => resolve(body));
        });
        const params = new URLSearchParams(bodyText);
        url = params.get('url') || params.get('value') || params.get('image_url') || '';
        user_name = params.get('user_name') || params.get('username') || '';
        alt_text = params.get('alt_text') || alt_text;
        source = params.get('source') || source;
        tags = normalizeTags(params.get('tags'));
        
      } else {
        // Fallback: try reading as text
        const bodyText = await new Promise((resolve) => {
          let body = '';
          req.on('data', chunk => body += chunk);
          req.on('end', () => resolve(body));
        });
        url = bodyText.trim().replace(/^"+|"+$/g, '');
      }
    } else {
      return res.status(405).json({ 
        success: false, 
        error: `Method ${method} not allowed. Use GET or POST.` 
      });
    }

    // Validate URL
    if (!isUrl(url)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or missing image URL',
        received_preview: (url || '').slice(0, 120)
      });
    }

    // Use service role client to bypass RLS
    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ 
        success: false, 
        error: 'Supabase configuration missing' 
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Save to image_library_items
    const record = {
      url: url.trim(),
      alt_text: alt_text || 'AI generated image',
      source: source || 'ai_generated',
      tags: tags && tags.length > 0 ? tags : []
    };

    if (user_name) {
      record.user_name = user_name;
    }

    const { data, error } = await supabase
      .from('image_library_items')
      .insert(record)
      .select()
      .single();

    if (error) {
      console.error('[Image Callback] DB error:', error);
      throw error;
    }

    console.log('[Image Callback] Success, saved image:', data.id);

    return res.status(200).json({
      success: true,
      saved: true,
      id: data.id,
      url: data.url,
      user_name: data.user_name || null
    });

  } catch (error) {
    console.error('[Image Callback] Error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to save image' 
    });
  }
}

