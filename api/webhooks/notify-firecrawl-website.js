// notifyFirecrawlWebsite: Trigger background crawl/indexing after Topics onboarding
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  // Enable CORS
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
    const { user_name, site_url, domain } = req.body;

    if (!user_name || !site_url) {
      return res.status(200).json({
        success: false,
        error: 'Missing required parameters: user_name, site_url'
      });
    }

    // Log the notification event to analytics_events for tracking
    await supabase
      .from('analytics_events')
      .insert({
        event_name: 'topics_onboarding_completed',
        properties: {
          user_name,
          site_url,
          domain,
          timestamp: new Date().toISOString()
        }
      });

    // Optional: Trigger a Firecrawl crawl job in the background
    // This is a fire-and-forget operation - we don't wait for it to complete
    if (FIRECRAWL_API_KEY) {
      // Start a crawl job with Firecrawl (async, don't block response)
      fetch('https://api.firecrawl.dev/v1/crawl', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: site_url,
          limit: 50,
          scrapeOptions: {
            formats: ['markdown'],
            onlyMainContent: true
          }
        })
      })
      .then(crawlRes => crawlRes.json())
      .then(crawlData => {
        console.log('Firecrawl crawl started:', crawlData);
        // Store the crawl ID for future reference if needed
        if (crawlData.id) {
          supabase
            .from('analytics_events')
            .insert({
              event_name: 'firecrawl_crawl_started',
              properties: {
                user_name,
                site_url,
                crawl_id: crawlData.id
              }
            });
        }
      })
      .catch(err => {
        console.error('Firecrawl crawl trigger failed:', err);
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Notification logged and background crawl initiated'
    });

  } catch (error) {
    console.error('notifyFirecrawlWebsite error:', error);
    return res.status(200).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}

