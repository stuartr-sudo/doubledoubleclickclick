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

    // Validate request
    const validation = await validateRequest(req, {
      requiredAuth: true,
      allowedMethods: ['POST']
    });

    if (!validation.success) {
      return createResponse(res, validation.error, 401);
    }

    const { user } = validation;
    const { url } = req.body;

    if (!url) {
      return createResponse(res, { error: 'URL is required' }, 400);
    }

    // Validate URL
    try {
      new URL(url);
    } catch (error) {
      return createResponse(res, { error: 'Invalid URL format' }, 400);
    }

    try {
      // Fetch the URL content
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; DoubleClickBot/1.0)'
        },
        timeout: 30000
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();

      // Extract title from HTML
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : 'Untitled';

      // Extract meta description
      const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i);
      const description = descMatch ? descMatch[1].trim() : '';

      // Extract main content (simplified extraction)
      const contentMatch = html.match(/<main[^>]*>(.*?)<\/main>/is) || 
                          html.match(/<article[^>]*>(.*?)<\/article>/is) ||
                          html.match(/<div[^>]*class=["'][^"']*content[^"']*["'][^>]*>(.*?)<\/div>/is);
      
      const mainContent = contentMatch ? contentMatch[1] : html;

      // Clean up HTML (basic cleaning)
      const cleanedContent = mainContent
        .replace(/<script[^>]*>.*?<\/script>/gis, '')
        .replace(/<style[^>]*>.*?<\/style>/gis, '')
        .replace(/<nav[^>]*>.*?<\/nav>/gis, '')
        .replace(/<header[^>]*>.*?<\/header>/gis, '')
        .replace(/<footer[^>]*>.*?<\/footer>/gis, '');

      // Log the scraping action
      await supabase
        .from('analytics_events')
        .insert({
          user_id: user.id,
          event_name: 'url_scraped',
          properties: { url, method: 'extract-content' },
          timestamp: new Date().toISOString()
        });

      return createResponse(res, {
        success: true,
        data: {
          title: title,
          content: cleanedContent,
          description: description,
          url: url,
          html: cleanedContent
        },
        method: 'extract-content'
      });

    } catch (error) {
      console.error('Content extraction error:', error);
      return createResponse(res, { error: 'Failed to extract content: ' + error.message }, 500);
    }

  } catch (error) {
    console.error('Extract content API error:', error);
    return createResponse(res, { error: 'Internal server error' }, 500);
  }
}
