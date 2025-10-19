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
    const { url, formats = ['markdown'], maxAge = 172800000 } = req.body;

    if (!url) {
      return createResponse(res, { error: 'URL is required' }, 400);
    }

    // Validate URL
    try {
      new URL(url);
    } catch (error) {
      return createResponse(res, { error: 'Invalid URL format' }, 400);
    }

    // Use Firecrawl API to scrape the URL
    const firecrawlApiKey = process.env.FIRECRAWL_API_KEY;
    
    if (!firecrawlApiKey) {
      return createResponse(res, { error: 'Firecrawl API key not configured' }, 500);
    }

    try {
      const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firecrawlApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: url,
          formats: formats,
          maxAge: maxAge,
          onlyMainContent: true
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Firecrawl API error:', errorData);
        return createResponse(res, { error: 'Failed to scrape URL with Firecrawl' }, 500);
      }

      const data = await response.json();

      // Log the scraping action
      await supabase
        .from('analytics_events')
        .insert({
          user_id: user.id,
          event_name: 'url_scraped',
          properties: { url, method: 'firecrawl' },
          timestamp: new Date().toISOString()
        });

      return createResponse(res, {
        success: true,
        data: data,
        method: 'firecrawl'
      });

    } catch (error) {
      console.error('Firecrawl scraping error:', error);
      return createResponse(res, { error: 'Failed to scrape URL: ' + error.message }, 500);
    }

  } catch (error) {
    console.error('Firecrawl API error:', error);
    return createResponse(res, { error: 'Internal server error' }, 500);
  }
}
