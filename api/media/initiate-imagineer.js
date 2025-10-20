// Initiate Imagineer AI image generation (external service)
import { createClientFromRequest } from '@/lib/supabase';
import { z } from 'zod';

const requestSchema = z.object({
  job_id: z.string().min(1, 'job_id is required'),
  prompt: z.string().min(1, 'prompt is required'),
  style: z.string().default('realistic'),
  influence: z.string().default('none'),
  dimensions: z.string().default('1024x1024'),
  placeholder_id: z.string().optional(),
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

    // Store job details in database
    const { error: jobError } = await supabase
      .from('imagineer_jobs')
      .insert({
        job_id: payload.job_id,
        prompt: payload.prompt,
        style: payload.style,
        influence: payload.influence,
        dimensions: payload.dimensions,
        status: 'pending',
        placeholder_id: payload.placeholder_id,
        user_name: payload.user_name
      });

    if (jobError) {
      console.error('[Imagineer] Job creation error:', jobError);
      return res.status(500).json({ error: 'Failed to create job' });
    }

    // Get Imagineer webhook URL
    const imagineerWebhookUrl = process.env.IMAGINEER_WEBHOOK_URL;
    if (!imagineerWebhookUrl) {
      return res.status(500).json({ error: 'Imagineer webhook URL not configured' });
    }

    // Build callback URL
    const appUrl = process.env.APP_URL;
    const callbackUrl = `${appUrl}/api/media/imagineer-callback`;

    // Fire and forget webhook call
    const imagineerPayload = {
      job_id: payload.job_id,
      prompt: payload.prompt,
      style: payload.style,
      influence: payload.influence,
      dimensions: payload.dimensions,
      callback_url: callbackUrl
    };

    console.log('[Imagineer] Sending webhook:', imagineerPayload);

    fetch(imagineerWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(imagineerPayload)
    }).catch(err => {
      console.error('[Imagineer] Webhook call failed:', err);
    });

    return res.status(200).json({
      success: true,
      job_id: payload.job_id,
      message: 'Image generation initiated'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors
      });
    }

    console.error('[Imagineer] Error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to initiate generation'
    });
  }
}

