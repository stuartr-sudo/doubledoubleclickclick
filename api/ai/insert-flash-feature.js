/**
 * Intelligent Flash Feature Insertion
 * 
 * Takes content + structure map + feature data and intelligently inserts
 * Flash features (tables, images, FAQs, products) at optimal locations
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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      content, 
      featureType, 
      featureData, 
      structureMap, 
      postId 
    } = req.body;

    if (!content || !featureType || !featureData) {
      return res.status(400).json({ 
        error: 'Missing required fields: content, featureType, featureData' 
      });
    }

    // Auth check
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid authentication' });
    }

    console.log(`🎯 Inserting Flash feature: ${featureType}`);

    // Build system prompt based on feature type
    const systemPrompt = getSystemPromptForFeature(featureType);

    // Call OpenAI to intelligently insert the feature
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.4,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: `Original content:\n${content}\n\nFeature to insert:\n${JSON.stringify(featureData, null, 2)}\n\nStructure map (use this to find optimal placement):\n${JSON.stringify(structureMap, null, 2)}\n\nReturn the FULL updated HTML with the feature intelligently inserted.`
        }
      ]
    });

    const updatedContent = completion.choices[0].message.content;

    console.log('✅ Feature inserted:', {
      featureType,
      tokensUsed: completion.usage.total_tokens
    });

    // Track usage in analytics
    if (postId) {
      await supabase.rpc('track_flash_usage', {
        p_workflow_id: null,
        p_post_id: postId,
        p_feature_type: featureType,
        p_success: true,
        p_tokens_used: completion.usage.total_tokens,
        p_metadata: { model: 'gpt-4o-mini', featureData }
      });
    }

    return res.status(200).json({
      success: true,
      updatedContent,
      tokensUsed: completion.usage.total_tokens,
      model: 'gpt-4o-mini'
    });

  } catch (error) {
    console.error('❌ Flash feature insertion error:', error);
    
    // Track failure
    if (req.body.postId) {
      await supabase.rpc('track_flash_usage', {
        p_workflow_id: null,
        p_post_id: req.body.postId,
        p_feature_type: req.body.featureType,
        p_success: false,
        p_error_message: error.message
      }).catch(() => {});
    }

    return res.status(500).json({
      error: 'Failed to insert Flash feature',
      details: error.message
    });
  }
}

/**
 * Get system prompt based on feature type
 */
function getSystemPromptForFeature(featureType) {
  const prompts = {
    table: `You are a content enhancement specialist. Insert HTML tables into content at optimal locations.

Rules:
- Place tables after introductory context
- Use semantic HTML with proper <table>, <thead>, <tbody> structure
- Add responsive wrapper: <div class="overflow-x-auto"><table>...</table></div>
- Style with Tailwind classes: border, padding, hover effects
- Maintain content flow - don't disrupt readability`,

    product: `You are a content enhancement specialist. Insert product cards into content at optimal locations.

Rules:
- Place product mentions where naturally relevant
- Use semantic HTML with proper structure
- Add product card wrapper with image, title, description, CTA
- Style with Tailwind classes for visual appeal
- Don't oversell - keep it natural and helpful`,

    faq: `You are a content enhancement specialist. Insert FAQ sections into content at optimal locations.

Rules:
- Place FAQs after main content, before conclusion
- Use semantic HTML: <div class="faq-section">
- Each FAQ: <details><summary>Question</summary><p>Answer</p></details>
- Style with Tailwind classes
- Keep answers concise and helpful`,

    image: `You are a content enhancement specialist. Insert image placeholders into content at optimal locations.

Rules:
- Place images where visual representation adds value
- Use semantic HTML: <figure><img><figcaption></figcaption></figure>
- Add placeholder with descriptive alt text
- Style with Tailwind classes
- Maintain content flow`,

    video: `You are a content enhancement specialist. Insert video placeholders into content at optimal locations.

Rules:
- Place videos in tutorial or how-to sections
- Use responsive video wrapper
- Add placeholder with descriptive text
- Style with Tailwind classes
- Don't interrupt reading flow`,

    cta: `You are a content enhancement specialist. Insert call-to-action buttons into content at optimal locations.

Rules:
- Place CTAs at natural conversion points
- Use action-oriented copy
- Style with Tailwind button classes
- Don't be too pushy - maintain authenticity`
  };

  return prompts[featureType] || prompts.table;
}

