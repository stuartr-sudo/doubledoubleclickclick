// TikTok video search using RapidAPI
import { createClientFromRequest } from '@/lib/supabase';
import { z } from 'zod';

const requestSchema = z.object({
  keywords: z.string().min(1, 'Search keywords are required'),
  count: z.number().int().min(1).max(50).optional().default(10)
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

    const apiKey = process.env.RAPIDAPI_TIKTOK_KEY;
    if (!apiKey) {
      console.error('[TikTok Search] RAPIDAPI_TIKTOK_KEY not configured');
      return res.status(500).json({ 
        error: 'TikTok API key is not configured' 
      });
    }

    console.log('[TikTok Search] Keywords:', payload.keywords);
    console.log('[TikTok Search] Count:', payload.count);

    // Build RapidAPI URL
    const searchParams = new URLSearchParams({
      keywords: payload.keywords,
      count: String(payload.count),
      cursor: '0',
      region: 'US',
      publish_time: '0',
      sort_type: '0'
    });

    const url = `https://tiktok-video-no-watermark2.p.rapidapi.com/feed/search?${searchParams.toString()}`;

    // Call RapidAPI
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'tiktok-video-no-watermark2.p.rapidapi.com'
      }
    });

    const result = await response.json();

    if (result.code !== 0 || !result.data) {
      console.error('[TikTok Search] API error:', result.msg);
      throw new Error(result.msg || 'Failed to fetch TikTok videos');
    }

    // Map videos to standardized format
    const videos = (result.data.videos || []).map(video => {
      const videoId = video.video_id || video.aweme_id;
      const authorId = video.author?.unique_id || video.author?.sec_uid;
      
      // Construct proper TikTok URL
      const webVideoUrl = videoId && authorId 
        ? `https://www.tiktok.com/@${authorId}/video/${videoId}`
        : video.share_url || video.web_url || `https://www.tiktok.com/video/${videoId}`;

      return {
        id: videoId,
        video_id: videoId,
        title: video.title || video.desc || "TikTok Video",
        web_video_url: webVideoUrl,
        cover_url: video.cover || video.dynamic_cover?.url_list?.[0] || video.video?.cover?.url_list?.[0],
        author_name: video.author?.nickname || video.author?.unique_id,
        url: webVideoUrl // Alias for compatibility
      };
    });

    console.log('[TikTok Search] Success, found', videos.length, 'videos');

    return res.status(200).json({
      success: true,
      videos: videos,
      total: videos.length,
      keywords: payload.keywords
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.errors 
      });
    }

    console.error('[TikTok Search] Error:', error);
    return res.status(500).json({ 
      error: error.message || 'TikTok search failed' 
    });
  }
}

