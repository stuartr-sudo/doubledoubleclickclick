// Humanize AI-generated text using RapidAPI Humanizer
import { createClientFromRequest } from '@/lib/supabase';
import { z } from 'zod';

const requestSchema = z.object({
  text: z.string().min(25, 'Text must be at least 25 characters'),
  tone: z.enum(['formal', 'casual', 'friendly', 'professional', 'storytelling', 'conversational']).optional().default('formal')
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

    // Get RapidAPI key
    const rapidApiKey = process.env.RAPIDAPI_TIKTOK_KEY;
    if (!rapidApiKey) {
      console.error('[Humanize Text] RAPIDAPI_TIKTOK_KEY not configured');
      return res.status(500).json({ 
        error: 'Humanizer API key not configured' 
      });
    }

    console.log('[Humanize Text] Processing text, length:', payload.text.length);
    console.log('[Humanize Text] Tone:', payload.tone);

    // Call RapidAPI Humanizer
    const response = await fetch('https://humanizer-apis.p.rapidapi.com/humanizer/basic', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-rapidapi-host': 'humanizer-apis.p.rapidapi.com',
        'x-rapidapi-key': rapidApiKey
      },
      body: JSON.stringify({
        text: payload.text,
        model: 'humanizer',
        level: 10,
        options: {
          skipMarkdown: true,
          skipCode: true,
          tone: payload.tone
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Humanize Text] RapidAPI error:', response.status, errorText);
      throw new Error(`RapidAPI request failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();

    // Validate response format
    if (!Array.isArray(data)) {
      console.error('[Humanize Text] Unexpected response format:', data);
      throw new Error('Unexpected API response format from Humanizer API');
    }

    // Process response - pick best alternative for each sentence
    const humanizedSentences = data.map(item => {
      if (!item.alternatives || item.alternatives.length === 0) {
        return item.original; // Fallback to original if no alternatives
      }
      
      // Find the alternative with the lowest AI probability
      const bestAlternative = item.alternatives.reduce((best, current) => 
        parseFloat(current.ai_probability) < parseFloat(best.ai_probability) ? current : best
      );
      
      return bestAlternative.sentence;
    });

    const humanizedText = humanizedSentences.join(' ');

    console.log('[Humanize Text] Success, output length:', humanizedText.length);

    return res.status(200).json({
      success: true,
      humanizedText: humanizedText,
      originalLength: payload.text.length,
      humanizedLength: humanizedText.length,
      tone: payload.tone
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.errors 
      });
    }

    console.error('[Humanize Text] Error:', error);
    return res.status(500).json({ 
      error: error.message || 'Text humanization failed' 
    });
  }
}

