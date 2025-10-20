// Get ElevenLabs voices list
import { z } from 'zod';

const requestSchema = z.object({}).optional();

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (!process.env.ELEVENLABS_API_KEY) {
      console.error('[Get ElevenLabs Voices] ELEVENLABS_API_KEY not configured');
      return res.status(500).json({ 
        error: 'ElevenLabs API key not configured',
        data: { error: 'Service configuration error' }
      });
    }

    console.log('[Get ElevenLabs Voices] Fetching voices from ElevenLabs API...');

    // Call ElevenLabs API to get voices
    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      method: 'GET',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Get ElevenLabs Voices] API error:', response.status, errorText);
      throw new Error(`ElevenLabs API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log('[Get ElevenLabs Voices] Success, found', data.voices?.length || 0, 'voices');

    // Return in the expected format
    return res.status(200).json({
      success: true,
      data: {
        voices: data.voices || []
      }
    });

  } catch (error) {
    console.error('[Get ElevenLabs Voices] Error:', error);

    return res.status(500).json({ 
      error: error.message || 'Failed to fetch voices',
      data: { error: error.message || 'Failed to fetch voice list. Please try again.' }
    });
  }
}

