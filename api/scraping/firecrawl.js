import { validateRequest, validateSchema } from '../utils/validation';
import { sendResponse } from '../utils/response';
import { getSupabaseClient } from '../utils/supabase';
import Firecrawl from '@mendable/firecrawl-js';

export default async function handler(req, res) {
  if (!validateRequest(req, res, 'POST')) {
    return;
  }

  const schema = {
    type: 'object',
    properties: {
      url: { type: 'string', format: 'url' },
      params: {
        type: 'object',
        properties: {
          pageOptions: { type: 'object' },
          extractorOptions: { type: 'object' },
          timeout: { type: 'number' },
          returnOnlyMainContent: { type: 'boolean' },
          waitFor: { type: 'number' },
          country: { type: 'string' },
          proxy: { type: 'string' },
        },
        additionalProperties: true,
      },
    },
    required: ['url'],
    additionalProperties: false,
  };

  if (!validateSchema(req, res, schema)) {
    return;
  }

  const { url, params } = req.body;
  const firecrawlApiKey = process.env.FIRECRAWL_API_KEY;

  if (!firecrawlApiKey) {
    return sendResponse(res, 500, { success: false, error: 'Firecrawl API key not configured.' });
  }

  try {
    const firecrawl = new Firecrawl({ apiKey: firecrawlApiKey });
    const result = await firecrawl.scrapeUrl(url, params);

    if (result && result.success) {
      return sendResponse(res, 200, { success: true, data: result.data });
    } else {
      return sendResponse(res, 500, { success: false, error: result?.error || 'Failed to scrape URL with Firecrawl.' });
    }
  } catch (error) {
    console.error('Firecrawl scraping error:', error);
    return sendResponse(res, 500, { success: false, error: error.message || 'Internal server error during Firecrawl scraping.' });
  }
}