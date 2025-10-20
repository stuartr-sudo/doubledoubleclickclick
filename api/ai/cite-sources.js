// AI-powered source citation with token gating
import { createClientFromRequest } from '@/lib/supabase';
import { z } from 'zod';

const requestSchema = z.object({
  content: z.string().min(1, 'Content is required'),
  sources: z.array(z.object({
    url: z.string().url(),
    title: z.string().optional(),
    excerpt: z.string().optional()
  })).optional(),
  citation_style: z.enum(['apa', 'mla', 'chicago', 'harvard', 'inline']).default('inline')
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

    // Feature flag check: ai_cite_sources
    const { data: flags, error: flagError } = await supabase
      .from('feature_flags')
      .select('*')
      .eq('flag_name', 'ai_cite_sources')
      .limit(1);

    const flag = flags && flags[0];

    if (!flag) {
      console.log('[Cite Sources] Feature flag not found, treating as free');
    } else if (flag.is_coming_soon) {
      return res.status(403).json({
        success: false,
        error: 'Feature coming soon',
        code: 'COMING_SOON'
      });
    } else {
      // Check if enabled
      const enabledGlobally = !!flag.is_enabled;
      const overrideMap = flag.user_overrides || {};
      const hasOverride = Object.prototype.hasOwnProperty.call(overrideMap, user.id);
      const personalOverride = hasOverride ? !!overrideMap[user.id] : null;
      const isEnabled = personalOverride !== null ? personalOverride : enabledGlobally;

      if (!isEnabled) {
        return res.status(403).json({
          success: false,
          error: 'Feature disabled',
          code: 'DISABLED'
        });
      }

      // Token check and deduction
      const tokenCost = flag.token_cost || 0;

      if (tokenCost > 0) {
        const { data: userProfile, error: profileError } = await supabase
          .from('user_profiles')
          .select('token_balance')
          .eq('id', user.id)
          .single();

        if (profileError || !userProfile) {
          return res.status(500).json({ error: 'Failed to fetch user profile' });
        }

        if ((userProfile.token_balance || 0) < tokenCost) {
          return res.status(402).json({
            success: false,
            error: 'Insufficient tokens',
            code: 'INSUFFICIENT_TOKENS',
            required: tokenCost,
            available: userProfile.token_balance || 0
          });
        }

        // Deduct tokens
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({ token_balance: (userProfile.token_balance || 0) - tokenCost })
          .eq('id', user.id);

        if (updateError) {
          console.error('[Cite Sources] Failed to deduct tokens:', updateError);
          return res.status(500).json({ error: 'Failed to deduct tokens' });
        }

        console.log(`[Cite Sources] Deducted ${tokenCost} tokens from user ${user.id}`);
      }
    }

    // Call OpenAI to generate citations
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    const systemPrompt = `You are an expert at academic citation and source attribution. 
Generate proper citations for the given content in ${payload.citation_style} style.
If sources are provided, use them. Otherwise, analyze the content and suggest where citations should be added.
Return the content with inline citations added in the appropriate format.`;

    const userPrompt = `Content:\n${payload.content}\n\n${
      payload.sources && payload.sources.length > 0
        ? `Sources:\n${payload.sources.map((s, i) => `[${i + 1}] ${s.title || s.url}\nURL: ${s.url}\n${s.excerpt || ''}`).join('\n\n')}`
        : 'No specific sources provided. Analyze the content and suggest where citations would be appropriate.'
    }`;

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
        temperature: 0.3,
        max_tokens: 2000
      })
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('[Cite Sources] OpenAI error:', errorText);
      return res.status(500).json({ error: 'OpenAI API error', details: errorText });
    }

    const openaiData = await openaiResponse.json();
    const citedContent = openaiData.choices?.[0]?.message?.content || '';

    return res.status(200).json({
      success: true,
      cited_content: citedContent,
      citation_style: payload.citation_style,
      sources_count: payload.sources?.length || 0
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors
      });
    }

    console.error('[Cite Sources] Error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to generate citations'
    });
  }
}

