// YouTube video search using YouTube Data API v3
import { z } from 'zod';

const requestSchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  maxResults: z.number().int().min(1).max(25).optional().default(10),
  safeSearch: z.enum(['none', 'moderate', 'strict']).optional().default('moderate')
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

    if (!process.env.YOUTUBE_API_KEY) {
      console.error('[YouTube Search] YOUTUBE_API_KEY not configured');
      return res.status(500).json({ 
        error: 'YouTube API key not configured',
        details: 'Service configuration error'
      });
    }

    console.log('[YouTube Search] Query:', payload.q);
    console.log('[YouTube Search] Max results:', payload.maxResults);
    console.log('[YouTube Search] Safe search:', payload.safeSearch);

    // Build YouTube API URL
    const url = new URL('https://www.googleapis.com/youtube/v3/search');
    url.searchParams.set('key', process.env.YOUTUBE_API_KEY);
    url.searchParams.set('part', 'snippet');
    url.searchParams.set('q', payload.q);
    url.searchParams.set('type', 'video');
    url.searchParams.set('maxResults', String(payload.maxResults));
    url.searchParams.set('safeSearch', payload.safeSearch);

    // Call YouTube API
    const ytResponse = await fetch(url.toString());

    if (!ytResponse.ok) {
      const errorText = await ytResponse.text();
      console.error('[YouTube Search] API error:', ytResponse.status, errorText);
      
      // Try to parse error as JSON
      let errorMessage = 'YouTube API error';
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error?.message || errorMessage;
      } catch (_) {
        // If not JSON, use the status text
      }
      
      return res.status(502).json({
        error: errorMessage,
        details: errorText
      });
    }

    const data = await ytResponse.json();

    // Transform results to standardized format
    const results = (data.items || [])
      .filter((item) => item?.id?.videoId && item?.snippet)
      .map((item) => {
        const videoId = item.id.videoId;
        const snippet = item.snippet;
        
        return {
          video_id: videoId,
          url: `https://www.youtube.com/watch?v=${videoId}`,
          embed_url: `https://www.youtube.com/embed/${videoId}`,
          title: snippet.title || '',
          description: snippet.description || '',
          thumbnail: snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url || '',
          thumbnail_high: snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url || '',
          channel_title: snippet.channelTitle || '',
          channel_id: snippet.channelId || '',
          published_at: snippet.publishedAt || '',
          published_date: snippet.publishTime || snippet.publishedAt || ''
        };
      });

    console.log('[YouTube Search] Success, found', results.length, 'videos');

    return res.status(200).json({
      success: true,
      results: results,
      total: results.length,
      query: payload.q
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.errors
      });
    }

    console.error('[YouTube Search] Error:', error);

    // Check for specific YouTube API errors
    if (error.message?.includes('quota')) {
      return res.status(500).json({
        error: 'YouTube API quota exceeded',
        details: 'Daily quota limit reached. Please try again tomorrow.'
      });
    }

    if (error.message?.includes('invalid_api_key') || error.message?.includes('API key not valid')) {
      return res.status(500).json({
        error: 'Invalid YouTube API key',
        details: 'Service configuration error'
      });
    }

    return res.status(500).json({ 
      error: error.message || 'YouTube search failed',
      details: 'An unexpected error occurred. Please try again.'
    });
  }
}

