// Direct FAL.ai image generation (sync response)
import { z } from 'zod';

const requestSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  aspect_ratio: z.string().optional(),
  model: z.string().optional().default('fal-ai/fast-sdxl')
});

export default async function handler(req, res) {
  // CORS headers
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
    // Validate request
    const payload = requestSchema.parse(req.body);

    // Check for FAL.ai API key
    const apiKey = process.env.FAL_AI_KEY;
    if (!apiKey) {
      console.error('[FAL.ai] FAL_AI_KEY not configured');
      return res.status(500).json({ 
        error: 'FAL.ai API key not configured' 
      });
    }

    console.log('[FAL.ai] Generating image with prompt:', payload.prompt.substring(0, 50) + '...');
    console.log('[FAL.ai] Model:', payload.model);
    if (payload.aspect_ratio) {
      console.log('[FAL.ai] Aspect ratio:', payload.aspect_ratio);
    }

    // Build FAL.ai endpoint URL
    const endpoint = payload.model.startsWith('http')
      ? payload.model
      : `https://fal.run/${payload.model}`;

    // Build request payload
    const falPayload = { prompt: payload.prompt };
    if (payload.aspect_ratio) {
      falPayload.aspect_ratio = payload.aspect_ratio;
    }

    // Call FAL.ai API
    let falResponse;
    try {
      falResponse = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Key ${apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
        },
        body: JSON.stringify(falPayload)
      });
    } catch (netError) {
      console.error('[FAL.ai] Network error:', netError);
      return res.status(502).json({ 
        error: `Network error contacting FAL.ai: ${netError.message}` 
      });
    }

    // Parse response
    const responseText = await falResponse.text();
    let responseJson = null;

    try {
      responseJson = responseText ? JSON.parse(responseText) : null;
    } catch (parseError) {
      // FAL.ai sometimes returns HTML error pages
      console.error('[FAL.ai] Non-JSON response:', responseText.substring(0, 400));
      return res.status(502).json({
        error: `FAL.ai responded with non-JSON (status ${falResponse.status})`,
        details: responseText.substring(0, 400)
      });
    }

    // Check for errors
    if (!falResponse.ok) {
      const errorMessage = 
        responseJson?.error ||
        responseJson?.message ||
        `FAL.ai error (status ${falResponse.status})`;
      
      console.error('[FAL.ai] API error:', errorMessage);
      return res.status(502).json({ 
        error: errorMessage, 
        details: responseJson 
      });
    }

    // Extract image URL from various possible response shapes
    const candidates = [
      responseJson?.image?.url,
      responseJson?.images?.[0]?.url,
      responseJson?.result?.[0]?.url,
      responseJson?.data?.[0]?.url,
      responseJson?.url,
      responseJson?.output?.[0]?.url,
      responseJson?.output?.url
    ];

    const imageUrl = candidates.find(Boolean);

    if (!imageUrl) {
      console.error('[FAL.ai] No image URL in response:', responseJson);
      return res.status(500).json({
        error: 'FAL.ai did not return an image URL',
        details: responseJson
      });
    }

    console.log('[FAL.ai] Success! Image URL:', imageUrl);

    return res.status(200).json({ 
      success: true,
      url: imageUrl,
      model: payload.model,
      prompt: payload.prompt
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.errors 
      });
    }

    console.error('[FAL.ai] Error:', error);
    return res.status(500).json({ 
      error: error.message || 'Image generation failed' 
    });
  }
}

