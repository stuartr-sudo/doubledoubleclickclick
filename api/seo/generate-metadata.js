// Generate comprehensive SEO metadata using AI
import { createClientFromRequest } from '@/lib/supabase';
import { z } from 'zod';

function stripTags(html = '') {
  return String(html).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function firstImageFromHtml(html = '') {
  const m = String(html).match(/<img[^>]+src=["']([^"']+)["']/i);
  return m?.[1] || '';
}

function slugify(input = '') {
  return String(input || '')
    .toLowerCase()
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function truncate(str = '', max = 160) {
  const s = String(str || '');
  if (s.length <= max) return s;
  return s.slice(0, max - 1).trimEnd();
}

function normalizeTags(arr) {
  const seen = new Set();
  const out = [];
  for (const t of Array.isArray(arr) ? arr : []) {
    const val = String(t || '').toLowerCase().trim();
    if (val && !seen.has(val)) {
      seen.add(val);
      out.push(val);
    }
    if (out.length >= 8) break;
  }
  return out;
}

const requestSchema = z.object({
  title: z.string().optional(),
  html: z.string().min(1, 'HTML content is required'),
  user_name: z.string().optional()
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

    const title = String(payload.title || '');
    const html = String(payload.html || '');
    const userName = String(payload.user_name || '');

    const articleText = stripTags(html).slice(0, 12000);
    const firstImg = firstImageFromHtml(html);

    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    const systemPrompt = `You are an expert SEO system. Generate comprehensive SEO metadata.

Strict requirements:
- meta_title: <= 60 chars, compelling, natural, title case, no quotes/emojis
- meta_description: <= 160 chars, benefit-forward, natural, no quotes/emojis
- focus_keyword: 2-4 words, realistic primary keyword phrase
- tags: 4-8 short lowercase tags relevant to content (no punctuation)
- excerpt: 1-2 sentences, <= 160 chars, engaging, no quotes/emojis
- slug: clean URL slug (lowercase letters, numbers, hyphens), <= 6 words
- featured_image: Representative image URL if inferrable, otherwise empty

Return ONLY valid JSON.`;

    const userPrompt = `Title: ${title || '(none)'}
User/Brand: ${userName || '(unknown)'}
Article (truncated): ${articleText}

Generate SEO metadata as JSON.`;

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' }
      })
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('[SEO Generate] OpenAI error:', errorText);
      return res.status(500).json({ error: 'Failed to generate SEO metadata' });
    }

    const openaiData = await openaiResponse.json();
    const responseText = openaiData.choices?.[0]?.message?.content || '{}';
    
    let llm;
    try {
      llm = JSON.parse(responseText);
    } catch (parseError) {
      console.error('[SEO Generate] Parse error:', parseError);
      llm = {};
    }

    // Post-process and sanitize
    const seo = {
      meta_title: truncate(llm?.meta_title || title || '', 60),
      meta_description: truncate(llm?.meta_description || '', 160),
      focus_keyword: String(llm?.focus_keyword || '').trim(),
      tags: normalizeTags(llm?.tags || []),
      excerpt: truncate(llm?.excerpt || llm?.meta_description || '', 160),
      slug: slugify(llm?.slug || title || ''),
      featured_image: String(llm?.featured_image || firstImg || '')
    };

    console.log('[SEO Generate] Generated metadata');

    return res.status(200).json({ success: true, seo });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors
      });
    }

    console.error('[SEO Generate] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'SEO generation failed'
    });
  }
}

