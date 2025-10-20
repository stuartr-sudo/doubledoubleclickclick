// createSitemap: Store sitemap in database
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { domain, pages, user_name, total_pages } = req.body || {};
    
    if (!domain || !Array.isArray(pages) || !user_name) {
      return res.status(200).json({ success: false, error: 'Missing required fields' });
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(200).json({ success: false, error: 'Supabase not configured' });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
      .from('sitemaps')
      .insert({
        domain,
        pages,
        user_name,
        total_pages: total_pages || pages.length
      })
      .select()
      .single();

    if (error) {
      console.error('[Sitemap API] Insert failed:', error);
      return res.status(200).json({ success: false, error: error.message });
    }

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('createSitemap API error:', error);
    return res.status(200).json({ success: false, error: error.message });
  }
}

