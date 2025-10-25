/**
 * AI Content Structure Analyzer
 * 
 * Analyzes content to identify optimal insertion points for Flash features:
 * - Tables (comparison data, feature lists)
 * - Products (product mentions, recommendations)
 * - FAQs (question patterns, explanations)
 * - Images (visual concepts, examples)
 * - Videos (tutorials, how-tos)
 * - CTAs (conversion points)
 */

import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { content, postId } = req.body;

    if (!content || typeof content !== 'string') {
      return res.status(400).json({ error: 'Content is required' });
    }

    // Get auth token from header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid authentication' });
    }

    console.log('🔍 Analyzing content structure...');

    // Call OpenAI to analyze content structure
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.3, // Low temp for consistent analysis
      messages: [
        {
          role: 'system',
          content: `You are a content structure analyzer. Analyze the provided HTML content and identify optimal locations to insert various content enhancement features.

Your task is to return a JSON structure map with insertion points for:
1. TABLES - Comparison data, feature lists, specifications
2. PRODUCTS - Product mentions that could use product cards
3. FAQS - Sections where FAQs would add value
4. IMAGES - Concepts that need visual representation
5. VIDEOS - Tutorial sections or how-tos
6. CTAS - Conversion points (end of value propositions)

For each insertion point, provide:
- type: The feature type
- location: Object with paragraph number or heading reference
- context: Why this location is optimal
- suggestion: Specific recommendation

Return ONLY valid JSON, no markdown, no explanations.`
        },
        {
          role: 'user',
          content: `Analyze this content and identify optimal Flash feature insertion points:\n\n${content.substring(0, 8000)}` // Limit to 8000 chars for token efficiency
        }
      ],
      response_format: { type: 'json_object' }
    });

    const structureMap = JSON.parse(completion.choices[0].message.content);

    console.log('✅ Content structure analyzed:', {
      sections: structureMap.sections?.length || 0,
      tokensUsed: completion.usage.total_tokens
    });

    // Cache the structure map if postId provided
    if (postId) {
      await supabase
        .from('content_structures')
        .upsert({
          post_id: postId,
          structure_map: structureMap,
          analyzed_at: new Date().toISOString()
        }, {
          onConflict: 'post_id'
        });
    }

    return res.status(200).json({
      success: true,
      structureMap,
      tokensUsed: completion.usage.total_tokens,
      model: 'gpt-4o-mini'
    });

  } catch (error) {
    console.error('❌ Content structure analysis error:', error);
    return res.status(500).json({
      error: 'Failed to analyze content structure',
      details: error.message
    });
  }
}

