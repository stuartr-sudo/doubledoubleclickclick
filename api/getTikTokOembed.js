// Get TikTok oEmbed data for video embedding
import { z } from 'zod';

const requestSchema = z.object({
  url: z.string().url('Valid TikTok URL required')
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    let url = '';

    if (req.method === 'GET') {
      const urlObj = new URL(`http://localhost${req.url}`);
      url = urlObj.searchParams.get('url') || '';
    } else if (req.method === 'POST') {
      const payload = requestSchema.parse(req.body);
      url = payload.url;
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Validate TikTok URL format
    const match = url.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/i);
    if (!match || !match[1]) {
      return res.status(400).json({
        success: false,
        error: 'Invalid TikTok video URL format'
      });
    }

    const videoId = match[1];
    console.log('[TikTok oEmbed] Video ID:', videoId);

    const apiKey = process.env.RAPIDAPI_TIKTOK_KEY;
    if (!apiKey) {
      console.error('[TikTok oEmbed] RAPIDAPI_TIKTOK_KEY not configured');
      return res.status(500).json({
        success: false,
        error: 'TikTok API key is not configured'
      });
    }

    let videoData = null;
    let author = null;
    let authorUsername = 'user';

    try {
      // Try RapidAPI first
      const rapidApiUrl = `https://tiktok-video-no-watermark2.p.rapidapi.com/video/${videoId}`;
      const response = await fetch(rapidApiUrl, {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': 'tiktok-video-no-watermark2.p.rapidapi.com'
        }
      });

      const result = await response.json();
      console.log('[TikTok oEmbed] RapidAPI response code:', result.code);

      if (result.code === 0 && result.data) {
        videoData = result.data;
        author = videoData.author;
        authorUsername = author?.unique_id || author?.nickname || 'user';
      } else {
        throw new Error(result.msg || `RapidAPI returned code ${result.code}`);
      }
    } catch (rapidError) {
      console.warn('[TikTok oEmbed] RapidAPI failed:', rapidError.message);
      
      // Fallback: Extract username from URL
      const urlMatch = url.match(/tiktok\.com\/@([^/]+)\/video/);
      if (urlMatch && urlMatch[1]) {
        authorUsername = urlMatch[1];
      }
    }

    // Generate embed HTML
    const embedHtml = `<blockquote class="tiktok-embed" cite="${url}" data-video-id="${videoId}">
  <section>
    <a target="_blank" title="@${authorUsername}" href="https://www.tiktok.com/@${authorUsername}">@${authorUsername}</a>
  </section>
</blockquote>
<script async src="https://www.tiktok.com/embed.js"></script>`;

    // Build response with metadata
    const response = {
      success: true,
      html: embedHtml,
      meta: {
        video_id: videoId,
        url: url,
        author_username: authorUsername,
        title: videoData?.title || videoData?.desc || 'TikTok Video',
        cover_url: videoData?.cover || videoData?.dynamic_cover?.url_list?.[0] || null
      }
    };

    console.log('[TikTok oEmbed] Success');

    return res.status(200).json(response);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }

    console.error('[TikTok oEmbed] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get TikTok embed data'
    });
  }
}

