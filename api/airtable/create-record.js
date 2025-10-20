// airtableCreateRecord: Create a new record in Airtable with Target Market enrichment
import { createClientFromRequest } from '@/lib/supabase';

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const KEYWORD_MAP_TABLE = process.env.KeywordMapTable;
const FAQ_TABLE = process.env.FrequentlyAskedQuestionsTable;

/**
 * Resolve Target Market from Username entity
 * This ensures all Airtable records have the canonical Target Market value
 */
async function resolveTargetMarket(supabase, user, fields, body) {
  // Determine username from payload or current user
  const uname =
    body?.user_name ||
    body?.username ||
    fields?.user_name ||
    fields?.Username ||
    (() => {
      const arr = Array.isArray(user?.assigned_usernames) ? user.assigned_usernames : [];
      return arr.length === 1 ? arr[0] : null;
    })();

  if (!uname) return null;

  // Fetch Username entity to get target_market
  const { data: rows, error } = await supabase
    .from('usernames')
    .select('target_market')
    .eq('user_name', uname)
    .limit(1);

  if (error || !rows || rows.length === 0) {
    console.warn('[Airtable] Could not resolve target_market for username:', uname);
    return null;
  }

  return rows[0]?.target_market || null;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const supabase = createClientFromRequest(req, res);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('[Airtable] Authentication error:', authError?.message);
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const body = req.body || {};
    let { tableId, tableIdEnvVar, type, fields } = body;
    fields = fields || {};
    
    // Resolve table ID: direct tableId, environment variable, or type-based fallback
    let resolvedTableId = tableId;
    
    if (tableIdEnvVar && process.env[tableIdEnvVar]) {
      resolvedTableId = process.env[tableIdEnvVar];
      console.log(`[Airtable] Using table ID from ${tableIdEnvVar}:`, resolvedTableId);
    } else if (!resolvedTableId) {
      // Type-based fallback for Topics Onboarding compatibility
      if (type === 'faq' && FAQ_TABLE) {
        resolvedTableId = FAQ_TABLE;
      } else if (type === 'keyword_map' && KEYWORD_MAP_TABLE) {
        resolvedTableId = KEYWORD_MAP_TABLE;
      }
    }
    
    if (!resolvedTableId || !fields || typeof fields !== 'object') {
      return res.status(200).json({ 
        success: false, 
        error: 'Missing tableId/tableIdEnvVar/type or fields' 
      });
    }
    
    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
      return res.status(200).json({ 
        success: false, 
        error: 'Airtable not configured (missing AIRTABLE_API_KEY or AIRTABLE_BASE_ID)' 
      });
    }

    // **Auto-enrich with Target Market** from Username entity
    const targetMarket = await resolveTargetMarket(supabase, user, fields, body);
    if (targetMarket) {
      fields['Target Market'] = targetMarket; // Common Airtable field casing
      fields['target_market'] = targetMarket; // Snake_case for consistency
      console.log('[Airtable] Enriched with Target Market:', targetMarket);
    }

    console.log(`[Airtable] Creating record in table ${resolvedTableId} with fields:`, Object.keys(fields));
    
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(resolvedTableId)}`;
    const atRes = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        records: [{ fields }],
        typecast: true // Auto-convert types where possible
      })
    });
    
    const data = await atRes.json();
    
    if (!atRes.ok) {
      console.error('[Airtable] Create failed:', data);
      return res.status(200).json({ 
        success: false, 
        error: data?.error?.message || 'Airtable error', 
        details: data 
      });
    }

    console.log('[Airtable] Record created successfully:', data?.records?.[0]?.id);
    const record = data?.records?.[0] || null;
    
    return res.status(200).json({ success: true, record });
    
  } catch (error) {
    console.error('[Airtable] Create record error:', error);
    return res.status(200).json({ 
      success: false, 
      error: error.message || 'Internal server error' 
    });
  }
}
