// airtableSync: listAll and updateRecord in a single endpoint
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
  console.error('Missing Airtable environment variables');
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, tableId, filterByFormula, recordId, fields } = req.body;

    if (!action || !tableId) {
      return res.status(200).json({ 
        success: false, 
        error: 'Missing required parameters: action and tableId' 
      });
    }

    // Resolve table name to table ID if needed
    const resolvedTableId = resolveTableId(tableId);

    if (action === 'listAll') {
      // List all records with pagination
      const records = [];
      let offset = null;
      
      do {
        const url = new URL(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(resolvedTableId)}`);
        if (offset) url.searchParams.set('offset', offset);
        if (filterByFormula) url.searchParams.set('filterByFormula', filterByFormula);
        url.searchParams.set('pageSize', '100');

        const response = await fetch(url.toString(), {
          headers: {
            'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();

        if (!response.ok) {
          return res.status(200).json({
            success: false,
            airtable_status: response.status,
            error: data.error?.message || 'Airtable API error',
            details: data.error
          });
        }

        if (data.records) {
          records.push(...data.records);
        }

        offset = data.offset;
      } while (offset);

      return res.status(200).json({
        success: true,
        records
      });
    }

    if (action === 'updateRecord') {
      if (!recordId || !fields) {
        return res.status(200).json({
          success: false,
          error: 'Missing recordId or fields for updateRecord'
        });
      }

      const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(resolvedTableId)}/${recordId}`;
      
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fields,
          typecast: true
        })
      });

      const data = await response.json();

      if (!response.ok) {
        return res.status(200).json({
          success: false,
          airtable_status: response.status,
          error: data.error?.message || 'Failed to update record',
          details: data.error
        });
      }

      return res.status(200).json({
        success: true,
        record: data
      });
    }

    return res.status(200).json({
      success: false,
      error: `Unknown action: ${action}`
    });

  } catch (error) {
    console.error('airtableSync error:', error);
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

