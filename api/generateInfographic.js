// Generate AI infographic using RapidAPI
import { createClientFromRequest } from '@/lib/supabase';
import { z } from 'zod';

const API_URL = 'https://ai-infographics-generator-api.p.rapidapi.com/save-data-API-grok.php';
const API_HOST = 'ai-infographics-generator-api.p.rapidapi.com';

const requestSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  text: z.string().optional(),
  faq: z.string().optional(),
  aboutus: z.string().optional(),
  logourl: z.string().url().optional(),
  companyname: z.string().optional()
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

    const apiKey = process.env.RAPIDAPI_AMAZON_KEY;
    if (!apiKey) {
      console.error('[Generate Infographic] RAPIDAPI_AMAZON_KEY not configured');
      return res.status(500).json({ 
        error: 'Infographic API key not configured' 
      });
    }

    console.log('[Generate Infographic] Title:', payload.title);
    if (payload.companyname) {
      console.log('[Generate Infographic] Company:', payload.companyname);
    }

    // Format as x-www-form-urlencoded
    const form = new URLSearchParams();
    form.append('title', payload.title);
    if (payload.text) form.append('text', payload.text);
    if (payload.faq) form.append('faq', payload.faq);
    if (payload.aboutus) form.append('aboutus', payload.aboutus);
    if (payload.logourl) form.append('logourl', payload.logourl);
    if (payload.companyname) form.append('companyname', payload.companyname);

    // Call RapidAPI
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': API_HOST,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: form.toString()
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Generate Infographic] API error:', response.status, errorText);
      return res.status(response.status).json({
        error: `RapidAPI request failed with status ${response.status}`,
        details: errorText
      });
    }

    const contentType = response.headers.get('content-type');

    // Handle binary image response
    if (contentType && contentType.startsWith('image/')) {
      console.log('[Generate Infographic] Received binary image');
      
      const imageBuffer = await response.arrayBuffer();
      const base64Image = Buffer.from(imageBuffer).toString('base64');

      return res.status(200).json({
        success: true,
        base64Image: base64Image,
        contentType: contentType,
        title: payload.title
      });
    }

    // Handle JSON response (if API behavior changes)
    try {
      const data = await response.json();
      console.log('[Generate Infographic] Received JSON response');
      
      const url = data?.url || data?.data?.url;
      if (!url) {
        console.error('[Generate Infographic] No URL in JSON response:', data);
        return res.status(500).json({
          error: 'Could not parse infographic URL from JSON response',
          raw: data
        });
      }

      return res.status(200).json({
        success: true,
        url: url,
        title: payload.title
      });
    } catch (parseError) {
      // Not JSON, not image - unexpected format
      const rawText = await response.text();
      console.error('[Generate Infographic] Unexpected response format:', rawText.substring(0, 200));
      
      return res.status(500).json({
        error: 'API returned non-image and non-JSON response',
        details: rawText.substring(0, 400)
      });
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.errors 
      });
    }

    console.error('[Generate Infographic] Error:', error);
    return res.status(500).json({ 
      error: error.message || 'Infographic generation failed' 
    });
  }
}

