// Transcribe audio using OpenAI Whisper API
import OpenAI from 'openai';
import { z } from 'zod';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const requestSchema = z.object({
  file_url: z.string().url('Valid audio file URL required')
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

    if (!process.env.OPENAI_API_KEY) {
      console.error('[Transcribe Audio] OPENAI_API_KEY not configured');
      return res.status(500).json({ 
        error: 'OpenAI API key not configured',
        data: { error: 'Service configuration error' }
      });
    }

    console.log('[Transcribe Audio] Downloading audio from:', payload.file_url);

    // Download audio file from URL
    const audioResponse = await fetch(payload.file_url);
    
    if (!audioResponse.ok) {
      throw new Error(`Failed to download audio: ${audioResponse.statusText}`);
    }

    const audioBuffer = await audioResponse.arrayBuffer();
    const audioBlob = new Blob([audioBuffer]);

    console.log('[Transcribe Audio] Audio downloaded, size:', audioBlob.size, 'bytes');

    // Determine file extension from URL or content type
    let extension = 'webm';
    const urlLower = payload.file_url.toLowerCase();
    if (urlLower.includes('.mp3')) extension = 'mp3';
    else if (urlLower.includes('.mp4') || urlLower.includes('.m4a')) extension = 'mp4';
    else if (urlLower.includes('.wav')) extension = 'wav';
    else if (urlLower.includes('.ogg')) extension = 'ogg';

    // Create File object for OpenAI (requires name with extension)
    const audioFile = new File([audioBlob], `audio.${extension}`, {
      type: audioResponse.headers.get('content-type') || `audio/${extension}`
    });

    console.log('[Transcribe Audio] Sending to OpenAI Whisper API...');
    console.log('[Transcribe Audio] File:', audioFile.name, audioFile.size, audioFile.type);

    // Call OpenAI Whisper API
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'en', // Can be made dynamic if needed
      response_format: 'text'
    });

    console.log('[Transcribe Audio] Transcription successful, length:', transcription.length);

    return res.status(200).json({
      success: true,
      data: {
        text: transcription,
        file_url: payload.file_url
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.errors,
        data: { error: 'Invalid request parameters' }
      });
    }

    console.error('[Transcribe Audio] Error:', error);

    // Check for specific OpenAI errors
    if (error.code === 'invalid_api_key') {
      return res.status(500).json({
        error: 'Invalid OpenAI API key',
        data: { error: 'Service configuration error' }
      });
    }

    if (error.code === 'insufficient_quota') {
      return res.status(500).json({
        error: 'OpenAI API quota exceeded',
        data: { error: 'Service temporarily unavailable' }
      });
    }

    return res.status(500).json({ 
      error: error.message || 'Transcription failed',
      data: { error: error.message || 'Transcription failed. Please try again.' }
    });
  }
}

