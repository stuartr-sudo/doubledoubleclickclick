// Analyze website for brand extraction (colors, fonts, layout)
import { createClientFromRequest } from '@/lib/supabase';
import { z } from 'zod';

const requestSchema = z.object({
  url: z.string().url('Valid URL is required'),
  extract_colors: z.boolean().default(true),
  extract_fonts: z.boolean().default(true),
  extract_layout: z.boolean().default(true),
  generate_css: z.boolean().default(true)
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

    console.log('[Brand Analyze] Analyzing website:', payload.url);

    // Use Firecrawl to scrape the website
    const firecrawlApiKey = process.env.FIRECRAWL_API_KEY;
    if (!firecrawlApiKey) {
      return res.status(500).json({ error: 'Firecrawl API key not configured' });
    }

    const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: payload.url,
        formats: ['html', 'markdown']
      })
    });

    if (!scrapeResponse.ok) {
      const errorText = await scrapeResponse.text();
      console.error('[Brand Analyze] Firecrawl error:', errorText);
      return res.status(500).json({ error: 'Failed to scrape website' });
    }

    const scrapeData = await scrapeResponse.json();
    const html = scrapeData.data?.html || '';

    // Use OpenAI to analyze the HTML and extract brand elements
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    const analysisPrompt = `Analyze this website HTML and extract brand elements:

HTML (truncated): ${html.substring(0, 10000)}

Extract and return JSON with:
{
  "extracted_colors": {
    "primary": "#hex",
    "secondary": "#hex",
    "accent": "#hex"
  },
  "extracted_typography": {
    "font_family": "font name"
  },
  "extracted_layout": {
    "type": "centered|full-width|sidebar",
    "max_width": "1200px"
  }
}`;

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are a web design expert. Extract brand elements from HTML.' },
          { role: 'user', content: analysisPrompt }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      })
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('[Brand Analyze] OpenAI error:', errorText);
      return res.status(500).json({ error: 'Failed to analyze website' });
    }

    const openaiData = await openaiResponse.json();
    const analysisText = openaiData.choices?.[0]?.message?.content || '{}';
    
    let analysis;
    try {
      analysis = JSON.parse(analysisText);
    } catch (parseError) {
      console.error('[Brand Analyze] Parse error:', parseError);
      analysis = {
        extracted_colors: {
          primary: '#1a365d',
          secondary: '#2c5282',
          accent: '#3182ce'
        },
        extracted_typography: {
          font_family: 'Inter, system-ui, sans-serif'
        },
        extracted_layout: {
          type: 'centered',
          max_width: '1200px'
        }
      };
    }

    const result = {
      success: true,
      ...analysis,
      website_domain: new URL(payload.url).hostname
    };

    console.log('[Brand Analyze] Analysis complete');

    return res.status(200).json(result);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors
      });
    }

    console.error('[Brand Analyze] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Website analysis failed'
    });
  }
}

