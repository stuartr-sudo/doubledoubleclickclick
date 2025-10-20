// Initiate AI image generation via external webhook (FAL.ai, Replicate, etc.)
import { createClientFromRequest } from '@/lib/supabase';
import { z } from 'zod';

const requestSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  model: z.string().optional(),
  params: z.record(z.any()).optional(),
  user_name: z.string().optional(),
  alt_text: z.string().optional(),
  tags: z.array(z.string()).optional()
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

    // Get webhook URL from environment
    const webhookUrl = process.env.IMAGE_GENERATION_WEBHOOK_URL;
    if (!webhookUrl) {
      console.error('[Generate Image Webhook] IMAGE_GENERATION_WEBHOOK_URL not configured');
      return res.status(500).json({ 
        error: 'Image generation webhook not configured' 
      });
    }

    // Get callback URL for this app
    const appUrl = process.env.APP_URL || 'https://your-app.vercel.app';
    const callbackUrl = `${appUrl}/api/media/image-callback`;

    // Build webhook URL with query parameters
    const url = new URL(webhookUrl);
    
    const queryPayload = {
      prompt: payload.prompt,
      model: payload.model,
      params: payload.params
    };
    
    url.searchParams.set('query', JSON.stringify(queryPayload));
    
    if (payload.user_name) url.searchParams.set('user_name', payload.user_name);
    if (payload.alt_text) url.searchParams.set('alt_text', payload.alt_text);
    if (callbackUrl) url.searchParams.set('callback_url', callbackUrl);
    if (payload.tags && payload.tags.length > 0) {
      url.searchParams.set('tags', payload.tags.join(','));
    }

    console.log('[Generate Image Webhook] Calling:', url.toString());

    // Call the external webhook
    const response = await fetch(url.toString(), {
      method: 'GET'
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Generate Image Webhook] Webhook error:', response.status, errorText);
      throw new Error(`Webhook call failed: ${response.status} ${errorText}`);
    }

    const responseData = await response.json();

    console.log('[Generate Image Webhook] Success');

    return res.status(200).json(responseData);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.errors 
      });
    }

    console.error('[Generate Image Webhook] Error:', error);
    return res.status(500).json({ 
      error: error.message || 'Image generation webhook failed' 
    });
  }
}

