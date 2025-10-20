// Generate text-to-speech audio using ElevenLabs
import { z } from 'zod';

const requestSchema = z.object({
  text: z.string().min(1, 'Text is required'),
  voice: z.string().min(1, 'Voice ID is required'),
  format: z.string().optional().default('mp3_44100_128') // mp3_44100_128, mp3_44100_192, pcm_16000, pcm_22050, pcm_24000, pcm_44100
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

    if (!process.env.ELEVENLABS_API_KEY) {
      console.error('[Generate ElevenLabs TTS] ELEVENLABS_API_KEY not configured');
      return res.status(500).json({ 
        error: 'ElevenLabs API key not configured',
        data: { error: 'Service configuration error', success: false }
      });
    }

    console.log('[Generate ElevenLabs TTS] Generating audio for voice:', payload.voice);
    console.log('[Generate ElevenLabs TTS] Text length:', payload.text.length, 'characters');
    console.log('[Generate ElevenLabs TTS] Format:', payload.format);

    // Map format to ElevenLabs output_format
    // ElevenLabs accepts: mp3_44100_128, mp3_44100_192, pcm_16000, pcm_22050, pcm_24000, pcm_44100, ulaw_8000
    const outputFormat = payload.format || 'mp3_44100_128';

    // Call ElevenLabs TTS API
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${payload.voice}`, {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg'
      },
      body: JSON.stringify({
        text: payload.text,
        model_id: 'eleven_monolingual_v1', // Can be made configurable: eleven_multilingual_v2, eleven_turbo_v2
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true
        },
        output_format: outputFormat
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Generate ElevenLabs TTS] API error:', response.status, errorText);
      
      // Try to parse error as JSON
      let errorMessage = `ElevenLabs API error: ${response.statusText}`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.detail?.message || errorJson.message || errorMessage;
      } catch (_) {
        // If not JSON, use the status text
      }
      
      throw new Error(errorMessage);
    }

    // Get audio data as buffer
    const audioBuffer = await response.arrayBuffer();
    const audioBase64 = Buffer.from(audioBuffer).toString('base64');

    console.log('[Generate ElevenLabs TTS] Success, audio size:', audioBuffer.byteLength, 'bytes');

    // Determine MIME type based on format
    let mimeType = 'audio/mpeg'; // Default for MP3
    if (outputFormat.startsWith('pcm_')) {
      mimeType = 'audio/pcm';
    } else if (outputFormat === 'ulaw_8000') {
      mimeType = 'audio/basic';
    }

    // Return in the expected format (base64 encoded)
    return res.status(200).json({
      success: true,
      data: {
        success: true,
        audio_base64: audioBase64,
        mime_type: mimeType,
        format: outputFormat,
        size: audioBuffer.byteLength
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.errors,
        data: { error: 'Invalid request parameters', success: false }
      });
    }

    console.error('[Generate ElevenLabs TTS] Error:', error);

    // Check for specific ElevenLabs errors
    if (error.message?.includes('quota')) {
      return res.status(500).json({
        error: 'ElevenLabs API quota exceeded',
        data: { error: 'Service temporarily unavailable - quota exceeded', success: false }
      });
    }

    if (error.message?.includes('invalid_api_key')) {
      return res.status(500).json({
        error: 'Invalid ElevenLabs API key',
        data: { error: 'Service configuration error', success: false }
      });
    }

    return res.status(500).json({ 
      error: error.message || 'TTS generation failed',
      data: { error: error.message || 'Audio generation failed. Please try again.', success: false }
    });
  }
}

