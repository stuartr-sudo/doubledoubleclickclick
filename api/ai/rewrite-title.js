/**
 * AI Title Rewrite Endpoint
 * Uses admin-configured LLM settings from Supabase
 * API key is stored securely in Vercel environment variables
 */

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Initialize Supabase client with server-side keys
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Secret stored in Vercel
});

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get auth token from request
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

    // Get request data
    const { title, content } = req.body;

    if (!title || typeof title !== 'string') {
      return res.status(400).json({ error: 'Title is required' });
    }

    // Fetch LLM settings for title_rewrite
    const { data: settings, error: settingsError } = await supabase
      .from('llm_settings')
      .select('*')
      .eq('feature_name', 'title_rewrite')
      .eq('is_enabled', true)
      .single();

    if (settingsError || !settings) {
      console.error('Failed to fetch LLM settings:', settingsError);
      return res.status(500).json({ 
        error: 'LLM settings not found. Please contact admin to configure title rewrite settings.' 
      });
    }

    // Prepare user prompt by replacing template variables
    const truncatedContent = (content || '').substring(0, 15000);
    const userPrompt = (settings.user_prompt_template || '')
      .replace(/\{\{title\}\}/g, title)
      .replace(/\{\{content\}\}/g, truncatedContent || '(no content yet)');

    // Call OpenAI with admin-configured settings
    const completion = await openai.chat.completions.create({
      model: settings.model || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: settings.system_prompt
        },
        {
          role: 'user',
          content: userPrompt
        }
      ],
      temperature: parseFloat(settings.temperature) || 0.7,
      max_tokens: parseInt(settings.max_tokens) || 100,
      top_p: settings.top_p ? parseFloat(settings.top_p) : undefined,
      frequency_penalty: settings.frequency_penalty ? parseFloat(settings.frequency_penalty) : undefined,
      presence_penalty: settings.presence_penalty ? parseFloat(settings.presence_penalty) : undefined,
    });

    const newTitle = completion.choices[0]?.message?.content?.trim();

    if (!newTitle || newTitle.length < 5) {
      return res.status(500).json({ 
        error: 'AI generated an invalid title. Please try again.' 
      });
    }

    // Clean up the title
    const cleanedTitle = newTitle
      .replace(/^["']|["']$/g, '') // Remove quotes
      .replace(/^\*\*|\*\*$/g, '')  // Remove bold markdown
      .replace(/^#+\s*/, '')        // Remove markdown headers
      .replace(/\n+/g, ' ')         // Remove newlines
      .trim();

    // Track usage (fire and forget)
    supabase.rpc('track_llm_usage', { setting_id: settings.id })
      .catch(err => console.error('Failed to track usage:', err));

    // Return the new title
    return res.status(200).json({
      success: true,
      newTitle: cleanedTitle,
      model: settings.model,
      tokensUsed: completion.usage?.total_tokens || 0
    });

  } catch (error) {
    console.error('Title rewrite error:', error);
    
    // Handle OpenAI-specific errors
    if (error.code === 'insufficient_quota') {
      return res.status(402).json({ 
        error: 'OpenAI API quota exceeded. Please contact admin.' 
      });
    }
    
    if (error.code === 'rate_limit_exceeded') {
      return res.status(429).json({ 
        error: 'Rate limit exceeded. Please try again in a moment.' 
      });
    }

    return res.status(500).json({ 
      error: error.message || 'Failed to rewrite title' 
    });
  }
}

