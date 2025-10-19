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
      return createResponse(res, validation.error, validation.status);
    }

    const { user } = validation;
    const { url } = req.body;

    if (!url) {
      return createResponse(res, { error: 'URL is required' }, 400);
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (error) {
      return createResponse(res, { error: 'Invalid URL format' }, 400);
    }

    // Use Firecrawl to get sitemap
    const firecrawlApiKey = process.env.FIRECRAWL_API_KEY;
    
    if (!firecrawlApiKey) {
      return createResponse(res, { error: 'Firecrawl API key not configured' }, 500);
    }

    try {
      // Use Firecrawl's map endpoint to get sitemap
      const response = await fetch('https://api.firecrawl.dev/v1/map', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firecrawlApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: url,
          limit: 50,
          includeSubdomains: false,
          allowExternalLinks: false,
          sitemap: 'include'
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Firecrawl API error: ${response.status} - ${errorData.message || response.statusText}`);
      }

      const data = await response.json();
      
      // Extract pages from Firecrawl response
      const pages = data.data?.map(page => ({
        url: page.url,
        title: page.title || extractTitleFromUrl(page.url)
      })) || [];

      // Save sitemap to database for future reference
      try {
        const domain = new URL(url).hostname;
        await supabase
          .from('sitemaps')
          .upsert({
            domain: domain,
            pages: pages,
            user_name: user.assigned_usernames?.[0] || user.email?.split('@')[0],
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'domain,user_name'
          });
      } catch (dbError) {
        console.error('Error saving sitemap to database:', dbError);
        // Don't fail the request if database save fails
      }

      return createResponse(res, { 
        success: true, 
        pages: pages,
        total: pages.length,
        source: 'firecrawl'
      });

    } catch (error) {
      console.error('Firecrawl sitemap error:', error);
      return createResponse(res, { 
        error: `Failed to fetch sitemap: ${error.message}` 
      }, 500);
    }

  } catch (error) {
    console.error('Sitemap API error:', error);
    return createResponse(res, { error: 'Internal server error' }, 500);
  }
}

// Helper function to extract title from URL
function extractTitleFromUrl(url) {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    
    if (pathname === '/' || pathname === '') {
      return 'Home';
    }
    
    const segments = pathname.split('/').filter(Boolean);
    const lastSegment = segments[segments.length - 1];
    
    return lastSegment
      .replace(/[-_]/g, ' ')
      .replace(/\.[^/.]+$/, '') // Remove file extension
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  } catch (error) {
    return 'Page';
  }
}