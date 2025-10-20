// addTopicKeyword: Quick-add keyword/faq to default tables
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
    const { keyword, target, username, userId } = req.body;

    if (!keyword) {
      return res.status(200).json({
        success: false,
        error: 'Missing required parameter: keyword'
      });
    }

    // Determine username
    let selectedUsername = username;
    if (!selectedUsername && userId) {
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('assigned_usernames')
        .eq('id', userId)
        .single();
      
      selectedUsername = userProfile?.assigned_usernames?.[0];
    }

    // Determine table name based on target
    let tableName;
    if (target === 'faq') {
      tableName = process.env.FrequentlyAskedQuestionsTable || 'FAQs';
    } else {
      tableName = process.env.KeywordMapTable || 'Keyword Map';
    }

    // Build fields object with minimal fields
    const fields = {
      Keyword: keyword,
      Topic: keyword, // Duplicate for compatibility
    };

    // Add username fields if available
    if (selectedUsername) {
      fields.Username = selectedUsername;
      fields.user_name = selectedUsername;
    }

    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        records: [{
          fields
        }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(200).json({
        success: false,
        airtable_status: response.status,
        error: data.error?.message || 'Failed to create keyword',
        details: data.error
      });
    }

    return res.status(200).json({
      success: true,
      created: data.records?.[0] || data
    });

  } catch (error) {
    console.error('addTopicKeyword error:', error);
    return res.status(200).json({
      success: false,
      error: error.message || 'Internal server error',
      details: error
    });
  }
}

