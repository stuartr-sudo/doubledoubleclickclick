// airtableDeleteRecord: Delete a record by ID
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

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
    const { tableId, recordId } = req.body;

    if (!tableId || !recordId) {
      return res.status(200).json({
        success: false,
        error: 'Missing required parameters: tableId and recordId'
      });
    }

    // Resolve table name to table ID if needed
    const resolvedTableId = resolveTableId(tableId);

    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(resolvedTableId)}/${recordId}`;
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return res.status(200).json({
        success: false,
        airtable_status: response.status,
        error: data.error?.message || 'Failed to delete record',
        details: data.error
      });
    }

    return res.status(200).json({
      success: true,
      deleted: true
    });

  } catch (error) {
    console.error('airtableDeleteRecord error:', error);
    return res.status(200).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}

// Helper to resolve friendly table names to IDs
function resolveTableId(tableId) {
  const tableMap = {
    'Keyword Map': process.env.KeywordMapTable || 'Keyword Map',
    'FAQs': process.env.FrequentlyAskedQuestionsTable || 'FAQs'
  };
  
  return tableMap[tableId] || tableId;
}

