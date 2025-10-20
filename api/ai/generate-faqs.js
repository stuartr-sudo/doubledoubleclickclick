// Generate relevant FAQs from article content using AI
import { createClientFromRequest } from '@/lib/supabase';
import { z } from 'zod';

function stripHtml(html = '') {
  return String(html)
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function uniqueFaqs(faqs, contentText) {
  const seen = new Set();
  const contentWords = new Set(
    contentText
      .toLowerCase()
      .split(/\W+/)
      .filter(w => w && w.length >= 4)
      .slice(0, 300)
  );

  const isGeneric = (q) => {
    const s = q.toLowerCase();
    // Guard against off-topic boilerplate
    const genericTerms = [
      'return policy',
      'shipping',
      'payment methods',
      'track my order',
      'international shipping',
      'warranty',
      'refund',
      'cancellation',
      'privacy policy',
      'contact customer support'
    ];
    return genericTerms.some(t => s.includes(t));
  };

  const hasOverlap = (q) => {
    const words = q.toLowerCase().split(/\W+/).filter(w => w.length >= 4);
    return words.some(w => contentWords.has(w));
  };

  const cleaned = [];
  for (const f of Array.isArray(faqs) ? faqs : []) {
    const q = (f?.question || '').trim();
    const a = (f?.answer || '').trim();
    if (!q || !a) continue;
    
    const key = q.toLowerCase();
    if (seen.has(key)) continue;
    
    // Keep only questions with topical overlap OR clearly in-article
    if (!hasOverlap(q) && isGeneric(q)) continue;

    seen.add(key);
    cleaned.push({ question: q, answer: a });
  }
  
  return cleaned.slice(0, 10);
}

const requestSchema = z.object({
  html: z.string().min(1, 'HTML content is required'),
  max_faqs: z.number().int().min(1).max(20).default(10),
  include_web_context: z.boolean().default(false)
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

    const contentText = stripHtml(payload.html).slice(0, 20000);

    if (!contentText || contentText.length < 100) {
      return res.status(400).json({ error: 'Content too short to generate FAQs' });
    }

    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    console.log('[FAQ Generator] Generating FAQs for content length:', contentText.length);

    const systemPrompt = `You are generating FAQs strictly grounded in the given article content.

Rules:
- Only include questions that are directly supported by the article.
- Do NOT include boilerplate e-commerce questions (returns, shipping, payment, tracking) unless the article explicitly discusses them.
- Questions should be specific and relevant to the article's topic.
- Answers should be concise (2-3 sentences) and factual.
- Return a JSON array: [{"question": "...", "answer": "..."}]
- Generate ${payload.max_faqs} high-quality FAQs.`;

    const userPrompt = `Article Content:\n\n${contentText}\n\nGenerate ${payload.max_faqs} relevant FAQs based on this content.`;

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
        max_tokens: 2000,
        response_format: { type: 'json_object' }
      })
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('[FAQ Generator] OpenAI error:', errorText);
      return res.status(500).json({ error: 'OpenAI API error', details: errorText });
    }

    const openaiData = await openaiResponse.json();
    const responseText = openaiData.choices?.[0]?.message?.content || '{}';

    let rawFaqs = [];
    try {
      const parsed = JSON.parse(responseText);
      rawFaqs = parsed.faqs || parsed.questions || parsed.items || (Array.isArray(parsed) ? parsed : []);
    } catch (parseError) {
      console.error('[FAQ Generator] Failed to parse response:', parseError);
      return res.status(500).json({ error: 'Failed to parse AI response' });
    }

    // Apply deduplication and relevance filtering
    const faqs = uniqueFaqs(rawFaqs, contentText);

    console.log('[FAQ Generator] Generated', faqs.length, 'FAQs');

    return res.status(200).json({
      success: true,
      faqs: faqs,
      count: faqs.length
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors
      });
    }

    console.error('[FAQ Generator] Error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to generate FAQs'
    });
  }
}

