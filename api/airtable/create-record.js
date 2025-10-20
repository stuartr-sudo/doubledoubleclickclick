// airtableCreateRecord: Create with Target Market enrichment
import { createClient } from '@supabase/supabase-js';

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  // Enable CORS
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
    const { tableId, type, fields, user_name, username } = req.body;

    if (!fields) {
      return res.status(200).json({
        success: false,
        error: 'Missing required parameter: fields'
      });
    }

    // Resolve table ID
    let resolvedTableId = tableId;
    if (type === 'keyword_map') {
      resolvedTableId = process.env.KeywordMapTable || 'Keyword Map';
    } else if (type === 'faq') {
      resolvedTableId = process.env.FrequentlyAskedQuestionsTable || 'FAQs';
    } else if (!tableId) {
      return res.status(200).json({
        success: false,
        error: 'Must provide either tableId or type'
      });
    }

    // Resolve target market from Username entity
    const selectedUsername = user_name || username;
    let targetMarket = null;

    if (selectedUsername) {
      const { data: usernameRecord } = await supabase
        .from('usernames')
        .select('target_market')
        .eq('username', selectedUsername)
        .single();

      targetMarket = usernameRecord?.target_market;
    }

    // Enrich fields with target market (both casings)
    const enrichedFields = { ...fields };
    if (targetMarket) {
      enrichedFields['Target Market'] = targetMarket;
      enrichedFields['target_market'] = targetMarket;
    }

    // Add username fields if provided
    if (selectedUsername) {
      enrichedFields['Username'] = selectedUsername;
      enrichedFields['user_name'] = selectedUsername;
    }

    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(resolvedTableId)}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        records: [{
          fields: enrichedFields
        }],
        typecast: true
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(200).json({
        success: false,
        airtable_status: response.status,
        error: data.error?.message || 'Failed to create record',
        details: data.error
      });
    }

    return res.status(200).json({
      success: true,
      record: data.records?.[0] || data
    });

  } catch (error) {
    console.error('airtableCreateRecord error:', error);
    return res.status(200).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}

