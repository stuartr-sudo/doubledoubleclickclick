// Napkin AI - Generate visuals/infographics from content
import { createClientFromRequest } from '@/lib/supabase';
import { z } from 'zod';

const requestSchema = z.object({
  content: z.string().min(1, 'Content is required'),
  context: z.string().optional(),
  format: z.enum(['png', 'svg', 'pdf']).default('png'),
  number_of_visuals: z.number().int().min(1).max(10).default(1),
  style_id: z.string().optional(),
  visual_query: z.string().optional(),
  transparent_background: z.boolean().default(false),
  color_mode: z.enum(['light', 'dark', 'auto']).default('light'),
  width: z.number().int().optional(),
  height: z.number().int().optional(),
  orientation: z.enum(['portrait', 'landscape', 'square', 'auto']).default('auto'),
  language: z.string().default('en')
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

    const napkinApiKey = process.env.NAPKIN_AI_API_KEY;
    if (!napkinApiKey) {
      console.error('[Napkin AI] API key not configured');
      return res.status(500).json({ 
        error: 'Napkin AI API key not configured' 
      });
    }

    console.log('[Napkin AI] Generating visual:', {
      format: payload.format,
      visuals: payload.number_of_visuals,
      orientation: payload.orientation,
      contentLength: payload.content.length
    });

    // Step 1: Create visual request
    const createPayload = {
      format: payload.format,
      content: payload.content,
      language: payload.language,
      number_of_visuals: payload.number_of_visuals,
      transparent_background: payload.transparent_background,
      color_mode: payload.color_mode,
      orientation: payload.orientation,
      text_extraction_mode: 'auto'
    };

    // Add optional fields
    if (payload.context) createPayload.context = payload.context;
    if (payload.style_id) createPayload.style_id = payload.style_id;
    if (payload.visual_query) createPayload.visual_query = payload.visual_query;
    if (payload.width) createPayload.width = payload.width;
    if (payload.height) createPayload.height = payload.height;

    console.log('[Napkin AI] Sending create request...');

    const createResponse = await fetch('https://api.napkin.ai/v1/visuals', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${napkinApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(createPayload)
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error('[Napkin AI] Create failed:', createResponse.status, errorText);
      return res.status(createResponse.status).json({
        error: `Napkin AI create request failed with status ${createResponse.status}`,
        details: errorText
      });
    }

    const createData = await createResponse.json();
    console.log('[Napkin AI] Create response:', createData);

    // Extract visual IDs or URLs from response
    // The API might return visuals immediately or require polling
    const visuals = createData.visuals || createData.data || [];
    
    if (visuals.length === 0) {
      console.warn('[Napkin AI] No visuals generated');
      return res.status(500).json({
        error: 'No visuals were generated',
        raw: createData
      });
    }

    // Process visuals
    const processedVisuals = visuals.map((visual, idx) => {
      return {
        id: visual.id || visual.visual_id || `visual_${idx}`,
        url: visual.url || visual.image_url || visual.download_url,
        thumbnail_url: visual.thumbnail_url || visual.preview_url,
        format: visual.format || payload.format,
        width: visual.width,
        height: visual.height,
        style: visual.style,
        metadata: {
          orientation: visual.orientation || payload.orientation,
          color_mode: visual.color_mode || payload.color_mode,
          transparent_background: visual.transparent_background
        }
      };
    });

    console.log('[Napkin AI] Generated', processedVisuals.length, 'visuals successfully');

    return res.status(200).json({
      success: true,
      visuals: processedVisuals,
      count: processedVisuals.length,
      request_id: createData.request_id || createData.id,
      raw: createData // Include raw response for debugging
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.errors 
      });
    }

    console.error('[Napkin AI] Error:', error);
    return res.status(500).json({ 
      error: error.message || 'Visual generation failed' 
    });
  }
}

