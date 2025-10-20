// Trustpilot company and review data integration
import { createClientFromRequest } from '@/lib/supabase';
import { z } from 'zod';

const requestSchema = z.object({
  action: z.enum(['category_companies', 'company_details', 'company_reviews']),
  category_id: z.string().optional(),
  company_id: z.string().optional(),
  page: z.number().int().min(1).default(1),
  min_rating: z.string().default('any'),
  sort: z.string().default('most_relevant'),
  country: z.string().optional(),
  locale: z.string().default('en-US')
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

    const apiKey = process.env.RAPIDAPI_TRUSTPILOT_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Trustpilot API key not configured' });
    }

    const headers = {
      'X-RapidAPI-Key': apiKey,
      'X-RapidAPI-Host': 'trustpilot-company-and-reviews-data.p.rapidapi.com'
    };

    let url;
    const params = new URLSearchParams();
    params.set('locale', payload.locale);

    if (payload.action === 'category_companies') {
      if (!payload.category_id) {
        return res.status(400).json({ error: 'category_id is required for this action' });
      }
      
      url = `https://trustpilot-company-and-reviews-data.p.rapidapi.com/categories/${payload.category_id}/companies`;
      params.set('page', String(payload.page));
      params.set('min_rating', payload.min_rating);
      params.set('sort', payload.sort);
      if (payload.country) params.set('country', payload.country.toUpperCase());
      
    } else if (payload.action === 'company_details') {
      if (!payload.company_id) {
        return res.status(400).json({ error: 'company_id is required for this action' });
      }
      
      url = `https://trustpilot-company-and-reviews-data.p.rapidapi.com/companies/${payload.company_id}`;
      
    } else if (payload.action === 'company_reviews') {
      if (!payload.company_id) {
        return res.status(400).json({ error: 'company_id is required for this action' });
      }
      
      url = `https://trustpilot-company-and-reviews-data.p.rapidapi.com/companies/${payload.company_id}/reviews`;
      params.set('page', String(payload.page));
      params.set('min_rating', payload.min_rating);
      params.set('sort', payload.sort);
    }

    const fullUrl = `${url}?${params.toString()}`;
    console.log('[Trustpilot] Calling:', fullUrl);

    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: headers
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Trustpilot] API error:', response.status, errorText);
      return res.status(response.status).json({
        error: `Trustpilot API error: ${response.statusText}`,
        details: errorText
      });
    }

    const data = await response.json();
    return res.status(200).json({
      success: true,
      data: data
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors
      });
    }

    console.error('[Trustpilot] Error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to fetch Trustpilot data'
    });
  }
}

