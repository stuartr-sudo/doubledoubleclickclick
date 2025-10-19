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
      return createResponse(res, validation.error, validation.status || 401);
    }

    const { user } = validation;
    const { url, limit = 200 } = req.body;

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
      // Try to fetch sitemap.xml first
      const sitemapUrls = [
        `${url}/sitemap.xml`,
        `${url}/sitemap_index.xml`,
        `${url}/sitemaps.xml`
      ];

      let pages = [];
      let sitemapFound = false;

      for (const sitemapUrl of sitemapUrls) {
        try {
          const response = await fetch(sitemapUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; DoubleClickBot/1.0)'
            },
            timeout: 10000
          });

          if (response.ok) {
            const xml = await response.text();
            pages = parseSitemapXML(xml, limit);
            if (pages.length > 0) {
              sitemapFound = true;
              break;
            }
          }
        } catch (error) {
          console.log(`Sitemap ${sitemapUrl} not found or error:`, error.message);
          continue;
        }
      }

      // If no sitemap found, try to discover pages by crawling
      if (!sitemapFound) {
        pages = await discoverPagesByCrawling(url, limit);
      }

      // Log the sitemap action
      await supabase
        .from('analytics_events')
        .insert({
          user_id: user.id,
          event_name: 'sitemap_fetched',
          properties: { url, pagesFound: pages.length },
          timestamp: new Date().toISOString()
        });

      return createResponse(res, {
        success: true,
        pages: pages,
        method: sitemapFound ? 'sitemap-xml' : 'crawling'
      });

    } catch (error) {
      console.error('Sitemap fetching error:', error);
      return createResponse(res, { error: 'Failed to fetch sitemap: ' + error.message }, 500);
    }

  } catch (error) {
    console.error('Sitemap API error:', error);
    return createResponse(res, { error: 'Internal server error' }, 500);
  }
}

function parseSitemapXML(xml, limit) {
  const pages = [];
  
  try {
    // Simple regex-based parsing for sitemap URLs
    const urlMatches = xml.match(/<loc>(.*?)<\/loc>/g);
    
    if (urlMatches) {
      for (const match of urlMatches) {
        const url = match.replace(/<\/?loc>/g, '').trim();
        if (url && isValidUrl(url)) {
          pages.push({
            url: url,
            title: extractTitleFromUrl(url)
          });
          
          if (pages.length >= limit) {
            break;
          }
        }
      }
    }
  } catch (error) {
    console.error('Error parsing sitemap XML:', error);
  }

  return pages;
}

async function discoverPagesByCrawling(baseUrl, limit) {
  const pages = [];
  const visited = new Set();
  const toVisit = [baseUrl];

  try {
    // Simple crawling to discover common page patterns
    const commonPaths = [
      '/',
      '/about',
      '/contact',
      '/blog',
      '/news',
      '/products',
      '/services',
      '/pricing',
      '/faq',
      '/support'
    ];

    for (const path of commonPaths) {
      const fullUrl = `${baseUrl}${path}`;
      
      try {
        const response = await fetch(fullUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; DoubleClickBot/1.0)'
          },
          timeout: 5000
        });

        if (response.ok) {
          pages.push({
            url: fullUrl,
            title: extractTitleFromUrl(fullUrl)
          });
          
          if (pages.length >= limit) {
            break;
          }
        }
      } catch (error) {
        // Ignore individual page errors
        continue;
      }
    }
  } catch (error) {
    console.error('Error during crawling:', error);
  }

  return pages;
}

function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

function extractTitleFromUrl(url) {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    
    // Extract meaningful title from URL path
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
