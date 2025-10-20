// Smart internal linking - add contextual internal links to content
import { createClientFromRequest } from '@/lib/supabase';
import { z } from 'zod';

function stripTags(html = '') {
  return String(html).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function normalizeText(s = '') {
  return String(s).toLowerCase().replace(/[\u2019']/g, "'").replace(/[^\p{L}\p{N}\s\-]/gu, ' ').replace(/\s+/g, ' ').trim();
}

function tokenize(s = '') {
  return normalizeText(s).split(' ').filter(Boolean);
}

const STOPWORDS = new Set([
  'the','a','an','of','to','for','and','with','in','on','at','by','from','is','are','be','as','it','that','this','these','those','your','our','their'
]);

function titleVariants(title = '') {
  const t = String(title || '').trim();
  if (!t) return [];
  
  const tokens = tokenize(t);
  const noStop = tokens.filter(w => !STOPWORDS.has(w));
  const uniq = (arr) => Array.from(new Set(arr.filter(s => String(s).trim().length > 0)));

  const variants = [
    t,
    tokens.join(' '),
    noStop.join(' ')
  ];

  // 2-3 word sliding windows
  for (let win = 3; win >= 2; win--) {
    for (let i = 0; i + win <= tokens.length; i++) {
      const chunk = tokens.slice(i, i + win).join(' ');
      variants.push(chunk);
    }
  }

  return uniq(variants).slice(0, 12);
}

function withinTagRange(lowerHtml, idx, openTag, closeTag) {
  const open = lowerHtml.lastIndexOf('<' + openTag, idx);
  const close = lowerHtml.indexOf('</' + openTag, idx);
  return open !== -1 && close !== -1 && open < idx && idx < close;
}

function isInsideAnchorOrHeading(lowerHtml, idx) {
  const tags = ['a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
  return tags.some(tag => withinTagRange(lowerHtml, idx, tag, tag + '>'));
}

function insertLinkOnce(html, anchorText, url) {
  if (!html || !anchorText || !url) return { html, inserted: false };
  
  const target = String(anchorText);
  const lowerHtml = html.toLowerCase();
  const lowerTarget = target.toLowerCase();

  let startPos = 0;
  while (true) {
    const idx = lowerHtml.indexOf(lowerTarget, startPos);
    if (idx === -1) return { html, inserted: false };
    
    if (!isInsideAnchorOrHeading(lowerHtml, idx)) {
      const before = html.slice(0, idx);
      const match = html.slice(idx, idx + target.length);
      const after = html.slice(idx + target.length);
      const anchor = `<a href="${url}" target="_blank" rel="noopener noreferrer">${match}</a>`;
      return { html: before + anchor + after, inserted: true };
    }
    
    startPos = idx + lowerTarget.length;
  }
}

const requestSchema = z.object({
  html: z.string().min(1, 'HTML content is required'),
  user_name: z.string().optional(),
  max_links: z.number().int().min(1).max(50).default(10),
  per_url_limit: z.number().int().min(1).max(5).default(2)
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
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const payload = requestSchema.parse(req.body);
    const { html, user_name, max_links, per_url_limit } = payload;

    console.log('[Internal Links] Processing for user_name:', user_name || '(none)');

    // Collect internal link targets
    let targets = [];

    if (user_name) {
      // Fetch sitemaps for the username
      const { data: sitemaps, error: sitemapError } = await supabase
        .from('sitemaps')
        .select('pages')
        .eq('user_name', user_name)
        .order('updated_date', { ascending: false })
        .limit(5);

      if (!sitemapError && sitemaps) {
        for (const sm of sitemaps) {
          const pages = Array.isArray(sm.pages) ? sm.pages : [];
          for (const p of pages) {
            const url = String(p?.url || '').trim();
            const title = String(p?.title || '').trim();
            if (url && title) {
              targets.push({ url, title });
            }
          }
        }
      }

      // Fallback: BlogPost as internal targets
      if (targets.length === 0) {
        const { data: posts, error: postError } = await supabase
          .from('blog_posts')
          .select('title, slug')
          .eq('user_name', user_name)
          .order('updated_date', { ascending: false })
          .limit(20);

        if (!postError && posts) {
          for (const post of posts) {
            const title = String(post?.title || '').trim();
            const slug = String(post?.slug || '').trim();
            const url = slug ? `/${slug}` : '';
            if (title && url) targets.push({ url, title });
          }
        }
      }
    }

    if (targets.length === 0) {
      console.log('[Internal Links] No internal targets available');
      return res.status(200).json({
        success: true,
        updated_html: html,
        links_used: 0,
        reason: 'No internal targets available'
      });
    }

    console.log('[Internal Links] Found', targets.length, 'potential targets');

    let outHtml = html;
    let used = 0;
    const perUrlCount = new Map();
    const usedAnchorsGlobal = new Set();

    // Process each target
    for (const target of targets) {
      if (used >= max_links) break;

      const url = target.url;
      const title = target.title;
      const currentCount = perUrlCount.get(url) || 0;
      
      if (currentCount >= per_url_limit) continue;

      const anchors = titleVariants(title);

      for (const candidate of anchors) {
        if (used >= max_links) break;

        const norm = normalizeText(candidate);
        if (!norm || norm.length < 2) continue;
        if (usedAnchorsGlobal.has(norm)) continue;

        const res = insertLinkOnce(outHtml, candidate, url);
        if (res.inserted) {
          outHtml = res.html;
          used += 1;
          usedAnchorsGlobal.add(norm);
          perUrlCount.set(url, (perUrlCount.get(url) || 0) + 1);
          
          if ((perUrlCount.get(url) || 0) >= per_url_limit) break;
        }
      }
    }

    console.log('[Internal Links] Inserted', used, 'links');

    return res.status(200).json({
      success: true,
      updated_html: outHtml,
      links_used: used,
      limits: { max_links, per_url_limit }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors
      });
    }

    console.error('[Internal Links] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal linking failed'
    });
  }
}

