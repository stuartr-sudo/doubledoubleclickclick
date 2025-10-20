// Find authoritative sources using Perplexity and add citations to content
import { createClientFromRequest } from '@/lib/supabase';
import { z } from 'zod';

function stripHtml(html) {
  if (!html) return '';
  return String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildSnippets(text, targetLen = 3600) {
  const t = String(text || '');
  if (t.length <= targetLen) return t;
  
  const part = Math.floor(targetLen / 3);
  const a = t.slice(0, part);
  const bStart = Math.max(0, Math.floor((t.length - part) / 2));
  const b = t.slice(bStart, bStart + part);
  const c = t.slice(-part);
  
  return `${a}\n...\n${b}\n...\n${c}`;
}

async function callPerplexity(snippets) {
  const key = process.env.PERPLEXITY_API_KEY;
  if (!key) {
    throw new Error('PERPLEXITY_API_KEY not configured');
  }

  const body = {
    model: 'sonar',
    temperature: 0.2,
    messages: [
      {
        role: 'system',
        content: 'You are a precise research assistant. Return 3–5 authoritative, recent, trustworthy external sources that support the given article content. Output ONLY JSON with the schema: {"references":[{"title":string,"url":string,"why":string}]}. Avoid spam and low-quality sites; prefer well-known publications, docs, standards, or academic sources. Return absolute https URLs.'
      },
      {
        role: 'user',
        content: `Article content snippets (begin/end included):\n${snippets}\n\nTask: Provide 3–5 authoritative external references as JSON only.`
      }
    ]
  };

  const res = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Perplexity API error: ${res.status} ${txt}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content || '';
  let jsonStr = content.trim();

  // Strip code fences if present
  const fence = jsonStr.match(/^\s*```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fence) jsonStr = fence[1].trim();

  let parsed;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    // Try extracting the first {...} block
    const m = jsonStr.match(/\{[\s\S]*\}/);
    if (!m) throw new Error('Failed to parse Perplexity response JSON');
    parsed = JSON.parse(m[0]);
  }

  const arr = Array.isArray(parsed?.references) ? parsed.references : [];
  
  // Normalize and filter
  const cleaned = arr
    .filter(r => r && typeof r.url === 'string' && /^https?:\/\//i.test(r.url))
    .slice(0, 5)
    .map(r => ({
      title: String(r.title || '').trim() || String(r.url),
      url: String(r.url).trim(),
      why: String(r.why || '').trim()
    }));

  return cleaned;
}

function buildReferencesSection(refs) {
  if (!refs || refs.length === 0) return '';
  
  const items = refs.map((r, i) =>
    `<li><strong>[${i + 1}]</strong> ${r.title} — <a href="${r.url}" target="_blank" rel="noopener noreferrer">${r.url}</a></li>`
  ).join('\n');
  
  return `
<section class="b44-references" style="margin:1.25rem 0;padding:1rem;border:1px solid #e5e7eb;border-radius:8px;background:#fff">
  <h4 style="margin:0 0 .5rem 0;">References</h4>
  <ol style="margin:0;padding-left:1.25rem">
    ${items}
  </ol>
</section>`.trim();
}

function stripExistingReferences(html) {
  if (!html) return html;
  return String(html).replace(/<section[^>]*class=["'][^"']*b44-references[^"']*["'][\s\S]*?<\/section>/gi, '');
}

const requestSchema = z.object({
  html: z.string().min(1, 'HTML content is required')
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
    const { html } = payload;

    const plain = stripHtml(html);
    
    if (plain.length < 100) {
      return res.status(400).json({ error: 'Content too short for citation' });
    }

    const snippets = buildSnippets(plain, 3600);

    console.log('[Find Source] Calling Perplexity for references...');
    const refs = await callPerplexity(snippets);
    console.log('[Find Source] Found', refs.length, 'references');

    const refsHtml = buildReferencesSection(refs);
    const withoutOld = stripExistingReferences(html);
    const updated = `${withoutOld}\n\n${refsHtml}`;

    return res.status(200).json({
      success: true,
      references: refs,
      references_html: refsHtml,
      updated_html: updated
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors
      });
    }

    console.error('[Find Source] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate references'
    });
  }
}

