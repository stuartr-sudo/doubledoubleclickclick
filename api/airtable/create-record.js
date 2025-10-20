// airtableCreateRecord: Create a new record in Airtable
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { tableId, tableIdEnvVar, fields } = req.body || {};
    
    // Resolve table ID: either direct tableId or from environment variable
    let resolvedTableId = tableId;
    if (tableIdEnvVar && process.env[tableIdEnvVar]) {
      resolvedTableId = process.env[tableIdEnvVar];
      console.log(`[Airtable] Using table ID from ${tableIdEnvVar}:`, resolvedTableId);
    }
    
    if (!resolvedTableId || !fields || typeof fields !== 'object') {
      return res.status(200).json({ success: false, error: 'Missing tableId/tableIdEnvVar or fields' });
    }
    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
      return res.status(200).json({ success: false, error: 'Airtable not configured' });
    }

    console.log(`[Airtable] Creating record in table ${resolvedTableId} with fields:`, Object.keys(fields));
    
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(resolvedTableId)}`;
    const atRes = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ records: [{ fields }] })
    });
    const data = await atRes.json();
    if (!atRes.ok) {
      console.error('[Airtable] Create failed:', data);
      return res.status(200).json({ success: false, error: data?.error?.message || 'Airtable error', details: data });
    }

    console.log('[Airtable] Record created successfully');
    const record = data?.records?.[0] || null;
    return res.status(200).json({ success: true, record });
  } catch (error) {
    console.error('airtableCreateRecord error:', error);
    return res.status(200).json({ success: false, error: error.message });
  }
}
